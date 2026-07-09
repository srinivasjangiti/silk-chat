# Silk Chat

Silk Chat is a clean, modern, multi-model chat interface powered by the NVIDIA API. It allows you to seamlessly switch between various LLMs including Meta's Llama, Mistral, Google's Gemma, Microsoft's Phi, and DeepSeek.

## Features
- **Multiple Models**: Access 120+ top-tier models for chat, coding, and reasoning.
- **Fast & Responsive**: Clean UI inspired by modern design paradigms (shadcn).
- **Light/Dark Mode**: Built-in theme toggling.
- **Local Proxy Server**: Avoids CORS issues by proxying API requests through a lightweight Node.js server.
- **Privacy-focused**: Your API key is stored locally in your browser's localStorage.

## Getting Started

### Prerequisites
- Node.js installed on your machine.
- An NVIDIA API Key (get one from [NVIDIA Build](https://build.nvidia.com)).

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/silk-chat.git
   cd silk-chat
   ```
2. Start the local server:
   ```bash
   node server.js
   ```
3. Open your browser and navigate to `http://localhost:3000`.
4. Click the **Settings** icon in the header and input your NVIDIA API Key.

## License
MIT License
