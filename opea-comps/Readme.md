## Running Ollama Third-Party Service


### Choosing a Model

We can get the model_id that Ollama will launch from the [Ollama Library](https://ollama.com/library/llama3.2)


HOST_IP=$(hostname -I awk '{print $1}') NO_PROXY=localhost
export LLM_ENDPOINT_PORT=8008
export LLM_MODEL_ID="llama3.2:1b"
export host_ip=192.168.2.52
docker-compose up

or you can try this 

HOST_IP=$(hostname -I awk '{print $1}') NO_PROXY=localhost
LLM_ENDPOINT_PORT=8008
LLM_MODEL_ID="llama3.2:1b"
docker compose up

### Getting the Host IP


#### Linux

### Ollama API

https://github.com/ollama/ollama/blob/main/docs/api.md


## Generate a Request

curl http://localhost:8008/api/generate -d '{
    "model": "llama3.2:1b"
    "prompt": "Why is the sky blue"
}



### Pull a Model

curl http://localhost:8008/api/pull -d '{
  "model": "llama3.2:1b"
}'

curl http://192.168.2.52:8008/api/pull -d '{
  "model": "llama3.2:1b"
}'


### Technical Uncertainty

In Bridge mode, is it allowed to access Ollama API with another model in docker compose? 
No. The host machine will be able to access it

Which port is being mapped ? 

In this case 8008 is the port that the host machine will access. The other is the guest port

If we pass the LLL_Model_ID to the Ollama server will it download the model on start ? 

It does not appear so. The Ollama CLI might be running multiple APIs so you need to call the pull api before trying to generate text 

Will th model be downloaded in the container?
Does that mean the Ml model will be deleted when the container stops running?



