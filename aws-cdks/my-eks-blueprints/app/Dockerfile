FROM public.ecr.aws/k6y9b9u3/figma/locust:2.12.2
COPY . ./

# for standalone
ENTRYPOINT ["locust", "-f", "./locustfile.py"]
# for worker
# CMD [ "--worker", "--master-host", "MASTER_HOST_NAME"]
# for master
# CMD ["--master"]
