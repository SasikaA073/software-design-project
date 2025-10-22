## Run this when not using docker
___
### Run following to create a new conda environment and install all dependencies.
___

``` bash
conda env create -f environment.yml
```
```bash
conda activate sdc_py_trainer_env
```
### Run the following to start the FastAPI server.
``` bash
uvicorn app.main:app --reload --port 8000
```
