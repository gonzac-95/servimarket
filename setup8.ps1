# Hook de favoritos
New-Item -Path "src\hooks" -ItemType Directory -Force | Out-Null
Set-Content -Path "src\hooks\useFavorites.ts" -Encoding UTF8 -Value @'
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("provider_id")
      .eq("user_id", user.id);
    setFavorites((data ?? []).map((f: any) => f.provider_id));
  }, [user]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  async function toggleFavorite(providerId: string) {
    if (!user) return;
    setLoading(true);
    const isFav = favorites.includes(providerId);
    if (isFav) {
      await supabase.from("favorites").delete()
        .eq("user_id", user.id).eq("provider_id", providerId);
      setFavorites(prev => prev.filter(id => id !== providerId));
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, provider_id: providerId });
      setFavorites(prev => [...prev, providerId]);
    }
    setLoading(false);
  }

  return { favorites, toggleFavorite, loading, isFavorite: (id: string) => favorites.includes(id) };
}
'@

Write-Host "✅ Hook de favoritos creado!" -ForegroundColor Green