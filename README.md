Uma aplicação Next.js, alimentada pelo SDK de IA da Vercel, que utiliza geração aumentada por recuperação (RAG) para raciocinar e responder com informações além dos dados de treinamento do modelo.
Funcionalidades

Recuperação e adição de informações através de chamadas de ferramentas usando a função streamText
Streaming em tempo real das respostas do modelo para o frontend usando o hook useChat
Armazenamento de embeddings vetoriais com DrizzleORM e PostgreSQL
Interface animada com Framer Motion

Primeiros Passos
Para colocar o projeto em funcionamento, siga estas etapas:

Instale as dependências:
npm install

Copie o arquivo de ambiente de exemplo:
cp .env.example .env

Adicione sua chave de API OpenAI e string de conexão PostgreSQL ao arquivo .env:
OPENAI_API_KEY=sua_chave_api_aqui
DATABASE_URL=sua_string_conexao_postgres_aqui

Migre o esquema do banco de dados:
npm run db:migrate

Inicie o servidor de desenvolvimento:
npm run dev


Seu projeto deve estar agora em execução em http://localhost:3000.