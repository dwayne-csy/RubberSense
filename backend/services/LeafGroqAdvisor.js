const Groq = require('groq-sdk');

class LeafGroqAdvisor {
  constructor() {
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.client = null;
    this.activeApiKey = null;
    this.refreshClient();
  }

  refreshClient() {
    const apiKey = process.env.GROQ_API_KEY || null;
    if (!apiKey) {
      this.client = null;
      this.activeApiKey = null;
      return;
    }
    if (this.client && this.activeApiKey === apiKey) {
      return;
    }
    this.client = new Groq({ apiKey });
    this.activeApiKey = apiKey;
  }

  normalizeSeverity(value, fallback = 'unknown') {
    const v = String(value || '').trim().toLowerCase();
    if (['none', 'healthy', 'no disease'].includes(v)) return 'none';
    if (['low', 'mild'].includes(v)) return 'low';
    if (['moderate', 'medium'].includes(v)) return 'moderate';
    if (['high', 'severe'].includes(v)) return 'high';
    if (v === 'critical') return 'critical';
    return fallback;
  }

  extractJson(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      throw new Error('Empty Groq response');
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      // Continue with bracket extraction.
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Groq response does not contain valid JSON');
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  toList(value, maxItems = 8) {
    let list = [];
    if (Array.isArray(value)) {
      list = value;
    } else if (value && typeof value === 'object') {
      list = Object.values(value);
    } else if (value !== null && value !== undefined) {
      list = String(value)
        .split(/\n|;\s+|\|\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
    }

    return list
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  buildContext(analysis) {
    const diseaseInfo = analysis?.diseaseInfo || {};
    const visual = analysis?.visualMetrics || {};
    const diseaseDetection = Array.isArray(analysis?.diseaseDetection) ? analysis.diseaseDetection : [];
    const primaryDisease = diseaseDetection[0] || null;

    return {
      disease: {
        name: primaryDisease?.name || diseaseInfo.name || analysis?.disease_detected || 'Unknown',
        confidence: Number(primaryDisease?.confidence ?? diseaseInfo.confidence ?? analysis?.confidence ?? 0),
        severity: this.normalizeSeverity(primaryDisease?.severity || diseaseInfo.severity, 'unknown'),
        recommendation: primaryDisease?.recommendation || '',
        healthStatus: diseaseInfo.healthStatus || analysis?.leafAnalysis?.healthStatus || 'unknown'
      },
      topPredictions: diseaseInfo.allPredictions || [],
      leafMetrics: {
        spotCount: Number(visual.spotCount || analysis?.spots_count || 0),
        dominantColor: String(visual.dominantColor || analysis?.leafAnalysis?.color || 'unknown'),
        texture: String(visual.texture || 'unknown'),
        leafCoverage: Number(visual.leafCoverage || 0)
      },
      tappabilityAssessment: analysis?.tappabilityAssessment || null,
      treeIdentification: analysis?.treeIdentification || null,
      tree: analysis?.tree || null,
      recommendations: Array.isArray(analysis?.recommendations) ? analysis.recommendations.slice(0, 8) : []
    };
  }

  buildFallbackInsights(context, reason = 'fallback') {
    const diseaseName = context?.disease?.name || 'Unknown';
    const severity = this.normalizeSeverity(context?.disease?.severity, 'unknown');
    const healthStatus = String(context?.disease?.healthStatus || '').toLowerCase();
    const healthy = severity === 'none' || healthStatus === 'healthy';

    const overallReport = healthy
      ? 'Leaf appears healthy based on the current detection output.'
      : `Leaf condition indicates possible ${diseaseName}. Focus on treatment and close monitoring.`;

    const diagnosis = healthy
      ? 'No major disease signs were detected in the analyzed leaf region.'
      : `Detected condition: ${diseaseName} with ${severity} severity.`;

    const treatmentPlan = healthy
      ? ['Continue routine monitoring every 1-2 weeks.']
      : this.toList(context?.recommendations, 5);

    const preventionPlan = [
      'Keep canopy airflow good through pruning.',
      'Avoid prolonged leaf wetness and overhead watering when possible.',
      'Remove and dispose of heavily infected leaves away from the plot.'
    ];

    const tappabilityAdvice = healthy
      ? 'Leaf condition is acceptable. Confirm trunk condition before tapping.'
      : 'Treat the leaf disease first and reassess tree health before tapping.';

    const promptRecommendations = healthy
      ? ['General rubber leaf care tips', 'Recommended monitoring schedule']
      : [`How to treat ${diseaseName}`, 'How to prevent recurrence in nearby trees'];

    const suggestions = [
      ...treatmentPlan,
      ...preventionPlan.slice(0, 2),
      tappabilityAdvice
    ].filter(Boolean);

    return {
      promptRecommendations: [...new Set(promptRecommendations)].slice(0, 5),
      suggestions: [...new Set(suggestions)].slice(0, 10),
      overallReport,
      diagnosis,
      treatmentPlan,
      preventionPlan,
      tappabilityAdvice,
      analysisTimestamp: new Date().toISOString(),
      version: 1,
      source: {
        provider: healthy ? 'rule_based' : 'groq_fallback',
        reason
      }
    };
  }

  async generate(analysis) {
    const context = this.buildContext(analysis);
    this.refreshClient();

    if (!this.client) {
      return this.buildFallbackInsights(context, 'groq_api_key_missing');
    }

    const systemPrompt =
      'You are an expert rubber-tree plant pathologist. Use only the provided ML output context. ' +
      'Do not invent findings beyond the context. Return strict JSON only.';

    const userPrompt = `
Generate concise AI insights for a rubber-tree leaf scan.

Return JSON with this exact shape:
{
  "overallReport": "string",
  "diagnosis": "string",
  "treatmentPlan": ["string"],
  "preventionPlan": ["string"],
  "tappabilityAdvice": "string",
  "promptRecommendations": ["string"],
  "suggestions": ["string"]
}

Rules:
1. Keep each item practical and farm-actionable.
2. Use max 6 items for treatmentPlan/preventionPlan/suggestions.
3. If healthy/no disease, explicitly say monitoring guidance.
4. If diseased, include urgency and what to do first.

Context:
${JSON.stringify(context)}
`.trim();

    try {
      let completion;
      try {
        completion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.2,
          max_tokens: 900,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        });
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        if (!message.includes('response_format')) {
          throw error;
        }
        completion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.2,
          max_tokens: 900,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        });
      }

      const content = completion?.choices?.[0]?.message?.content || '';
      const parsed = this.extractJson(content);

      const insights = {
        overallReport: String(parsed?.overallReport || '').trim(),
        diagnosis: String(parsed?.diagnosis || '').trim(),
        treatmentPlan: this.toList(parsed?.treatmentPlan, 6),
        preventionPlan: this.toList(parsed?.preventionPlan, 6),
        tappabilityAdvice: String(parsed?.tappabilityAdvice || '').trim(),
        promptRecommendations: this.toList(parsed?.promptRecommendations, 5),
        suggestions: this.toList(parsed?.suggestions, 10)
      };

      if (!insights.overallReport || !insights.diagnosis) {
        return this.buildFallbackInsights(context, 'groq_missing_core_fields');
      }

      if (insights.promptRecommendations.length === 0) {
        insights.promptRecommendations = this.buildFallbackInsights(context, 'groq_empty_prompts').promptRecommendations;
      }
      if (insights.suggestions.length === 0) {
        insights.suggestions = this.buildFallbackInsights(context, 'groq_empty_suggestions').suggestions;
      }

      return {
        ...insights,
        analysisTimestamp: new Date().toISOString(),
        version: 1,
        source: {
          provider: 'groq',
          model: this.model
        }
      };
    } catch (error) {
      console.error('LeafGroqAdvisor failed, using fallback insights:', error);
      return this.buildFallbackInsights(context, 'groq_request_failed');
    }
  }
}

module.exports = new LeafGroqAdvisor();
