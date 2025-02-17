#!/bin/bash
uvicorn opea_image2video_microservice:app --host 0.0.0.0 --port 9369 --log-level debug