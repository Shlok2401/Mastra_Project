# Mastra_Project
Title: Berkshire Hathaway Intelligence — RAG System using Mastra
Goal: Build a production-ready Retrieval-Augmented Generation (RAG) application that answers questions about Warren Buffett's investment philosophy using Berkshire Hathaway’s shareholder letters.

Key Features:

Uses the Mastra framework for full-stack RAG development.

Ingests shareholder letters (2019–2024) via MDocument.

Embeds and stores document chunks in a vector database (e.g., PostgreSQL + pgvector).

Creates a GPT-4o-based agent that handles memory, tools, citation, and streaming.

Implements a web chat interface with real-time responses and source attribution.
