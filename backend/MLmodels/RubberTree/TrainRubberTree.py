# backend/MLmodels/RubberTree/TrainRubberTree.py
import yaml
from pathlib import Path
from ultralytics import YOLO
import argparse
import torch

class RubberTreeTrainer:
    def __init__(self, model_name='yolo11n.pt', data_yaml='data.yaml'):
        self.model_name = model_name
        self.data_yaml = data_yaml
        self.project_dir = Path(__file__).parent
        
        # Load configuration
        with open(self.project_dir / self.data_yaml, 'r') as f:
            self.config = yaml.safe_load(f)
        
        print(f"Training Configuration:")
        print(f"Model: {self.model_name}")
        print(f"Classes: {self.config['names']}")
        print(f"Number of classes: {self.config['nc']}")
        
    def train(self, epochs=100, imgsz=640, batch=16, device=None):
        """Train the YOLO model"""
        try:
            # Set device
            if device is None:
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
            print(f"Using device: {device}")
            
            # Load model
            model_path = self.project_dir / self.model_name
            if not model_path.exists():
                print(f"Model {model_name} not found, using base YOLOv11 model")
                model = YOLO('yolo11n.pt')
            else:
                model = YOLO(str(model_path))
            
            # Training arguments
            train_args = {
                'data': str(self.project_dir / self.data_yaml),
                'epochs': epochs,
                'imgsz': imgsz,
                'batch': batch,
                'device': device,
                'workers': 4,
                'save': True,
                'save_period': 10,
                'cache': False,
                'name': 'rubber_tree_yolo11',
                'patience': 50,
                'box': 7.5,
                'cls': 0.5,
                'dfl': 1.5,
                'close_mosaic': 10,
                'resume': False,
                'amp': True,
                'fraction': 1.0,
                'profile': False,
                'seed': 42,
                'deterministic': True,
                'single_cls': False,
                'rect': False,
                'cos_lr': False,
                'label_smoothing': 0.0,
                'overlap_mask': True,
                'mask_ratio': 4,
                'dropout': 0.0,
                'val': True,
                'plots': True,
                'exist_ok': True
            }
            
            print("Starting training...")
            print(f"Training parameters: {train_args}")
            
            # Start training
            results = model.train(**train_args)
            
            # Validate the model
            print("\nValidating model...")
            metrics = model.val()
            
            # Save the trained model
            best_model_path = self.project_dir / 'weights' / 'best.pt'
            if not best_model_path.exists():
                best_model_path = self.project_dir / 'runs/detect/rubber_tree_yolo11/weights/best.pt'
            
            if best_model_path.exists():
                # Copy to main directory
                import shutil
                final_model_path = self.project_dir / 'yolov11_custom.pt'
                shutil.copy2(best_model_path, final_model_path)
                print(f"\n✅ Trained model saved to: {final_model_path}")
            
            return {
                'success': True,
                'metrics': metrics,
                'results': results
            }
            
        except Exception as e:
            print(f"Training failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def test(self, model_path=None):
        """Test the trained model"""
        try:
            if model_path is None:
                model_path = self.project_dir / 'yolov11_custom.pt'
                if not model_path.exists():
                    return {'success': False, 'error': 'Model not found'}
            
            model = YOLO(str(model_path))
            
            # Test on validation set
            results = model.val(data=str(self.project_dir / self.data_yaml))
            
            return {
                'success': True,
                'metrics': results
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

def main():
    parser = argparse.ArgumentParser(description='Train Rubber Tree YOLO Model')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--imgsz', type=int, default=640, help='Image size')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--device', type=str, default=None, help='Device (cuda/cpu)')
    parser.add_argument('--test', action='store_true', help='Test mode')
    
    args = parser.parse_args()
    
    trainer = RubberTreeTrainer()
    
    if args.test:
        print("Testing model...")
        result = trainer.test()
        print(f"Test result: {result}")
    else:
        print(f"Training model for {args.epochs} epochs...")
        result = trainer.train(
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            device=args.device
        )
        print(f"Training completed: {result}")

if __name__ == '__main__':
    main()