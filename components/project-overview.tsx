import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { InformationIcon, VercelIcon } from "./icons";

const ProjectOverview = () => {
  return (
    <motion.div
      className="w-full max-w-[600px] my-4"
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 5 }}
    >
      <div className="border rounded-lg p-6 flex flex-col gap-4 text-neutral-500 text-sm dark:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
        <p className="flex flex-row justify-center gap-4 items-center text-neutral-900 dark:text-neutral-50">
          <VercelIcon size={16} />
          <span>+</span>
          <InformationIcon />
        </p>
        <p>
          O hook{" "}
          <Link
            href="https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat"
            className="text-blue-500"
          >
            useChat
          </Link>{" "}
          junto com a função{" "}
          <Link
            href="https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-text"
            className="text-blue-500"
          >
            streamText
          </Link>{" "}
          permite construir aplicações com capacidades de geração aumentada por recuperação (RAG). 
          Os dados são armazenados como embeddings vetoriais usando DrizzleORM e PostgreSQL.
        </p>
        <p>
          Aprenda a construir este projeto seguindo este{" "}
          <Link
            className="text-blue-500"
            href="https://sdk.vercel.ai/docs/guides/rag-chatbot"
            target="_blank"
          >
            guia
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};

export default ProjectOverview;
