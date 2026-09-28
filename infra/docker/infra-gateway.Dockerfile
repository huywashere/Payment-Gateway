FROM golang:1.24-alpine AS build
WORKDIR /src
COPY services/infra-gateway/go.mod ./
COPY services/infra-gateway/cmd ./cmd
RUN CGO_ENABLED=0 go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/infra-gateway ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache wget && adduser -D -u 65532 nonroot \
    && printf '#!/bin/sh\nwget -q --spider http://127.0.0.1:8090/healthz\n' > /infra-gateway-healthcheck \
    && chmod +x /infra-gateway-healthcheck
COPY --from=build /out/infra-gateway /infra-gateway
USER nonroot
EXPOSE 8090
ENTRYPOINT ["/infra-gateway"]
