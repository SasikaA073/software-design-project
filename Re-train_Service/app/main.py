from fastapi import FastAPI, BackgroundTasks
from app.roboflow_trainer import trigger_training

app = FastAPI(
    title="Roboflow Retraining Service",
    description="A microservice to retrain Roboflow models from Java backend",
    version="1.0",
)

# In-memory store of jobs (for simple tracking)
jobs = {}

@app.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    """
    Triggers a new retraining job asynchronously.
    """
    import uuid
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued"}
    background_tasks.add_task(_train_task, job_id)
    return {"job_id": job_id, "status": "queued"}

def _train_task(job_id: str):
    result = trigger_training()
    jobs[job_id] = result

@app.get("/train/{job_id}")
async def get_job_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return {"status": "unknown", "job_id": job_id}
    return {"job_id": job_id, **job}
