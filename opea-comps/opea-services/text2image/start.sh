#!/bin/bash
uvicorn opea_text2image_microservice:app --host 0.0.0.0 --port 9379 --log-level debug