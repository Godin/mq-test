#!/bin/sh

curl \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.everest-preview+json" \
    --data '{"event_type": "trigger"}' \
    -X POST https://api.github.com/repos/Godin/mq-test/dispatches
