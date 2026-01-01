// This function is not used.
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    // 1. אבטחה: ודא שהמשתמש הוא אדמין
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admins only' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    try {
        const { id } = await req.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'Asset ID is required' }), { status: 400 });
        }

        // 2. מחיקת הרשומה מהדאטהבייס
        // הערה: פעולה זו לא מוחקת את הקובץ עצמו מהאחסון, רק את הרשומה שמצביעה אליו.
        await base44.asServiceRole.entities.Asset.delete(id);

        return new Response(JSON.stringify({ message: 'Asset deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Asset delete error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});