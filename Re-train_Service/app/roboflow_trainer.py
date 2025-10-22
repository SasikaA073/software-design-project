from roboflow import Roboflow
from app.config import Config
import traceback


def trigger_training():
    """
    Triggers a retraining process:
    - Creates a new dataset version with augmentations
    - Starts model training on that version
    Returns info about the created version and job.
    """
    try:
        print("[INFO] Initializing Roboflow client...")
        rf = Roboflow(api_key=Config.ROBOFLOW_API_KEY)
        project = rf.workspace(Config.WORKSPACE).project(Config.PROJECT)

        # Generate a new version with preprocessing/augmentations
        print("[INFO] Creating new version with augmentations...")
        new_version = project.generate_version(
            {
                "preprocessing": {
                    "auto-orient": True
                },
                "augmentation": {
                    "rotate": {"degrees": 15},
                    "brightness": {"brighten": True, "darken": True, "percent": 25},
                    "blur": {"pixels": 2.5},
                },
            }
        )

        print(f"[INFO] New dataset version created: {new_version}")
        version = project.version(new_version)

        # Train the version
        print("[INFO] Triggering model training...")
        job = version.train(
            model_type="yolov11s",
            checkpoint=None,
            plot_in_notebook=False,
        )

        print(f"[INFO] Training job triggered: {job}")
        return {
            "status": "success",
            "workspace": Config.WORKSPACE,
            "project": Config.PROJECT,
            "version": new_version,
            "job": str(job),
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
