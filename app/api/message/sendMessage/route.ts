import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Message from "@/models/Message";

export async function POST(req: Request) {
    try {
        const { chatId, username, message } = await req.json();

        await connectDB();

        const chat = await Message.findOne({ messageId: chatId });
        if (!chat) return NextResponse.json({ error: "Chat not found" });

        chat.chat.push({
            username,
            message,
            messageType: "text",
            sentAt: new Date()
        });

        await chat.save();

        return NextResponse.json({ success: true });

    } catch (err) {
        return NextResponse.json({ error: "server error" });
    }
}
