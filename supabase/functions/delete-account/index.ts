import { withSupabase } from 'npm:@supabase/server';

export default {
  fetch: withSupabase({ auth: 'user' }, async (_req, ctx) => {
    const userId = ctx.userClaims?.sub || ctx.userClaims?.id;

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rows, error: rowsError } = await ctx.supabaseAdmin
      .from('screenshots')
      .select('storage_path')
      .eq('user_id', userId);

    if (rowsError) {
      return Response.json({ error: rowsError.message }, { status: 500 });
    }

    const paths = (rows || [])
      .map((row) => row.storage_path)
      .filter(Boolean);

    for (let index = 0; index < paths.length; index += 100) {
      const group = paths.slice(index, index + 100);
      const { error: storageError } = await ctx.supabaseAdmin.storage
        .from('screenshots')
        .remove(group);

      if (storageError) {
        return Response.json({ error: storageError.message }, { status: 500 });
      }
    }

    const { error: deleteRowsError } = await ctx.supabaseAdmin
      .from('screenshots')
      .delete()
      .eq('user_id', userId);

    if (deleteRowsError) {
      return Response.json({ error: deleteRowsError.message }, { status: 500 });
    }

    const { error: deleteUserError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      return Response.json({ error: deleteUserError.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  }),
};
