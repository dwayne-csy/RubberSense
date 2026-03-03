const Groq = require('groq-sdk');

class TrunkGroqAdvisor {
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

  isAvailable() {
    this.refreshClient();
    return !!this.client;
  }

  normalizePriority(value) {
    const v = String(value || '').toLowerCase().trim();
    if (['immediate', 'critical', 'urgent'].includes(v)) return 'immediate';
    if (['soon', 'high', 'near-term'].includes(v)) return 'soon';
    if (['monitor', 'watch'].includes(v)) return 'monitor';
    return 'routine';
  }

  normalizeUrgency(value) {
    const v = String(value || '').toLowerCase().trim();
    if (['critical', 'immediate'].includes(v)) return 'critical';
    if (['high', 'urgent'].includes(v)) return 'high';
    if (['medium', 'moderate'].includes(v)) return 'medium';
    return 'low';
  }

  normalizeSeverity(value, fallback = 'low') {
    const v = String(value || '').toLowerCase().trim();
    if (['none', 'healthy'].includes(v)) return 'none';
    if (['critical'].includes(v)) return 'critical';
    if (['high', 'severe'].includes(v)) return 'high';
    if (['medium', 'moderate', 'mild to moderate'].includes(v)) return 'medium';
    if (['low', 'mild'].includes(v)) return 'low';
    return fallback;
  }

  extractJson(text) {
    if (!text) throw new Error('Empty Groq response');

    const trimmed = text.trim();
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

  sanitizeDisease(aiDisease, analysis) {
    const primary = analysis.primary_detection || {};
    const modelDetected = String(primary.health_status || '').toLowerCase() === 'diseased';
    const fallbackSeverity = this.normalizeSeverity(primary.severity, modelDetected ? 'medium' : 'none');

    const symptoms = Array.isArray(aiDisease?.symptoms)
      ? aiDisease.symptoms
          .map((s) => String(s || '').trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];

    return {
      name: String(aiDisease?.name || primary.display_name || primary.class_name || 'Unknown').trim(),
      class: String(primary.class_name || primary.class || 'unknown').trim(),
      severity: this.normalizeSeverity(aiDisease?.severity, fallbackSeverity),
      confidence: Number(primary.confidence || 0),
      description: String(aiDisease?.description || '').trim() || 'No AI description provided.',
      treatment: String(aiDisease?.treatment || '').trim() || 'No AI treatment provided.',
      symptoms,
      latex_impact: String(aiDisease?.latex_impact || '').trim() || 'No AI latex impact provided.',
      urgency: this.normalizeUrgency(aiDisease?.urgency),
      detected: modelDetected
    };
  }

  sanitizeRecommendations(items = []) {
    const recs = Array.isArray(items) ? items : [];
    const sanitized = recs
      .map((item) => ({
        priority: this.normalizePriority(item?.priority),
        action: String(item?.action || '').trim(),
        description: String(item?.description || '').trim(),
        timeframe: String(item?.timeframe || '').trim() || 'as soon as practical'
      }))
      .filter((item) => item.action && item.description)
      .slice(0, 7);

    if (sanitized.length === 0) {
      throw new Error('Groq returned empty care recommendations');
    }

    return sanitized;
  }

  buildContext(analysis) {
    const primary = analysis.primary_detection || {};
    const topPredictions = Array.isArray(analysis.all_predictions)
      ? analysis.all_predictions.slice(0, 3)
      : [];

    return {
      primary_detection: {
        class_name: primary.class_name || primary.class || 'unknown',
        display_name: primary.display_name || primary.class_name || primary.class || 'unknown',
        confidence: Number(primary.confidence || 0),
        health_status: primary.health_status || 'unknown',
        severity: primary.severity || 'unknown'
      },
      health_score: Number(analysis.health_score || 0),
      age_estimation: analysis.age_estimation || null,
      maturity: analysis.maturity || null,
      visual_analysis: analysis.visual_analysis || null,
      top_predictions: topPredictions
    };
  }

  async generate(analysis) {
    this.refreshClient();
    if (!this.client) {
      throw new Error('Groq advisor unavailable: GROQ_API_KEY is not configured (same key used by groqchatbot)');
    }

    const context = this.buildContext(analysis);

    const systemPrompt =
      'You are an expert rubber-tree pathologist. Use ONLY the provided ML outputs. ' +
      'Do not invent disease classes that are not in the context. ' +
      'Return strict JSON only.';

    const userPrompt = `
Generate disease interpretation and care plan.

Requirements:
1. Use model detection as source of truth for detected status/class.
2. Provide practical symptoms, treatment, and latex impact text for that class.
3. Provide 4-7 care recommendations with priority in: immediate, soon, monitor, routine.
4. Urgency must be one of: low, medium, high, critical.
5. Severity must be one of: none, low, medium, high, critical.
6. Output MUST be JSON with this exact shape:
{
  "disease": {
    "name": "string",
    "severity": "none|low|medium|high|critical",
    "description": "string",
    "treatment": "string",
    "symptoms": ["string"],
    "latex_impact": "string",
    "urgency": "low|medium|high|critical"
  },
  "care_recommendations": [
    {
      "priority": "immediate|soon|monitor|routine",
      "action": "string",
      "description": "string",
      "timeframe": "string"
    }
  ]
}

ML Context:
${JSON.stringify(context)}
`.trim();

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

    const disease = this.sanitizeDisease(parsed?.disease, analysis);
    const care_recommendations = this.sanitizeRecommendations(parsed?.care_recommendations);

    return {
      disease,
      care_recommendations,
      source: {
        provider: 'groq',
        model: this.model,
        generated_at: new Date().toISOString()
      }
    };
  }
}

module.exports = new TrunkGroqAdvisor();
