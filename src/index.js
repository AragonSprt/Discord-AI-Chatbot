require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

// Ensure required environment variables are present
if (!process.env.GEMINI_API_KEY || !process.env.DISCORD_BOT_TOKEN) {
    console.error("Missing environment variables. Please set GEMINI_API_KEY and DISCORD_BOT_TOKEN.");
    process.exit(1);
}

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// Set the ID of the dedicated channel for chat
const DEDICATED_CHANNEL_ID = 'YOUR_CHANNEL_ID_HERE';

// Event listener for when the bot is ready
client.on('ready', () => {
    const readyMessage = `${client.user.tag} is online and ready to chat!`;
    console.log(readyMessage);
});

// Event listener for new messages
client.on('messageCreate', async (message) => {
    // Ignore messages from bots and messages not in the dedicated channel
    if (message.author.bot || message.channel.id !== DEDICATED_CHANNEL_ID) return;

    try {
        // Start a new chat session and send user input to the AI
        const chatSession = model.startChat({ generationConfig, history: [] });
        const result = await chatSession.sendMessage(message.content);

        // Send the AI's response back to the Discord channel
        await message.channel.send(result.response.text());
    } catch (error) {
        const errorLog = `Error interacting with AI: ${error.message}`;
        console.error(errorLog);

        await message.channel.send("Sorry, I couldn't process that. Please try again later.");
    }
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);
