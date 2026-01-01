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
        const formData = await req.formData();
        const file = formData.get('file');
        const name = formData.get('name');
        const description = formData.get('description');

        if (!file || !name) {
            return new Response(JSON.stringify({ error: 'File and name are required' }), { status: 400 });
        }

        // 2. העלאת הקובץ דרך אינטגרציית הליבה
        // שימוש ב-asServiceRole כי הפונקציה מבצעת את הפעולה בשם המערכת, לאחר אימות המשתמש
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

        if (!file_url) {
            throw new Error('File upload failed to return a URL.');
        }

        // 3. שמירת המידע בישות Asset
        const newAsset = await base44.asServiceRole.entities.Asset.create({
            name,
            description,
            file_url,
            file_type: file.type,
            file_size: file.size,
            created_by: user.email // שמירת המעלה לצרכי תיעוד
        });

        return new Response(JSON.stringify(newAsset), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Asset upload error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});