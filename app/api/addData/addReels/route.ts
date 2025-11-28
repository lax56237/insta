import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: err }, { status: 500 });
    }
}
