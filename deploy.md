1|

docker run -itd -v $PWD/.next:/app/.next  
    -v $PWD/.next:/app/.next \



docker run --name chat-next-web-xiaoxin -d -p 3020:3000 \
   -e OPENAI_API_KEY=sk-fQxhmcNLyH8A8TCL84079fF081074658A5809a2b96537aAb \
   -e CODE=aixiaoxin123 \
   -e BASE_URL=https://api.aixiaoxin.cloud \
   -e CUSTOM_MODELS=-all,+deepseek-chat,+deepseek-coder,+gpt-4o-mini \
   -e DEFAULT_MODEL=deepseek-chat \
   -e ENABLE_BALANCE_QUERY=1 \
    -v $PWD/public:/app/public \
    -v $PWD/standalone:/app/ \
    -v $PWD/static:/app/.next/static \
    -v $PWD/server:/app/.next/server \
   yidadaa/chatgpt-next-web




docker run --name chat-next-web-xiaoxin -d -p 3020:3000    -e OPENAI_API_KEY=sk-fQxhmcNLyH8A8TCL84079fF081074658A5809a2b96537aAb    -e CODE=aixiaoxin123    -e BASE_URL=https://api.aixiaoxin.cloud    -e CUSTOM_MODELS=-all,+gpt-4o-mini,gpt-4o    -e DEFAULT_MODEL=gpt-4o-mini     -v $PWD/public:/app/public     -v $PWD/standalone:/app/     -v $PWD/static:/app/.next/static     -v $PWD/server:/app/.next/server    yidadaa/chatgpt-next-web



docker run --name chat-next-web-xiaoxin -d -p 3020:3000    -e OPENAI_API_KEY=sk-fQxhmcNLyH8A8TCL84079fF081074658A5809a2b96537aAb-5    -e CODE=aixiaoxin123    -e BASE_URL=https://api.aixiaoxin.cloud    -e CUSTOM_MODELS=-all,+gpt-4o-mini,gpt-4o    -e DEFAULT_MODEL=gpt-4o-mini     -v $PWD/public:/app/public     -v $PWD/standalone:/app/     -v $PWD/static:/app/.next/static     -v $PWD/server:/app/.next/server    yidadaa/chatgpt-next-web