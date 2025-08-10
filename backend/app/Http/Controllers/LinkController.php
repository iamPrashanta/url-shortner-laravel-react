<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLinkRequest;
use App\Models\Link;
use App\Models\Visit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LinkController extends Controller
{
    // POST /api/links
    public function store(StoreLinkRequest $request)
    {
        $validated = $request->validated();
        $originalUrl = $validated['original_url'];
        $desired = $validated['short_code'] ?? null;

        // If the same original URL already has a short code? optional behavior
        // We'll always create new unless short code exists; but ensure uniqueness on short_code.

        // If custom short code provided, ensure unique
        if ($desired) {
            if (Link::where('short_code', $desired)->exists()) {
                return response()->json([
                    'message' => 'Short URL already exists. Choose another.',
                    'field' => 'short_code'
                ], 409);
            }
            $short = $desired;
        } else {
            // Generate random code: [0-9a-zA-Z], length up to 6 (we'll use exactly 6)
            $alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $length = 6;

            // Try a few times to avoid collisions
            for ($i = 0; $i < 5; $i++) {
                $short = collect(range(1, $length))
                    ->map(fn() => $alphabet[random_int(0, strlen($alphabet) - 1)])
                    ->implode('');

                if (!Link::where('short_code', $short)->exists()) {
                    break;
                }
            }

            if (Link::where('short_code', $short)->exists()) {
                return response()->json(['message' => 'Could not generate a unique short code. Try again.'], 500);
            }
        }

        $link = Link::create([
            'short_code' => $short,
            'original_url' => $originalUrl,
        ]);

        // Return full short URL form like https://website.com/{shortURL}
        $base = config('app.front_url') ?? config('app.url');
        $shortUrl = rtrim($base, '/') . '/' . $link->short_code;

        return response()->json([
            'id' => $link->id,
            'short_code' => $link->short_code,
            'short_url' => $shortUrl,
            'original_url' => $link->original_url,
            'visits_count' => $link->visits_count,
            'created_at' => $link->created_at,
        ], 201);
    }

    // GET /{short}
    // This will be used by the public redirect endpoint
    public function redirectShort(Request $request, string $short)
    {
        $link = Link::where('short_code', $short)->first();
        if (!$link) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Log visit
        Visit::create([
            'link_id' => $link->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // Increment cached count
        $link->increment('visits_count');

        // Redirect
        return redirect()->away($link->original_url, 302);
    }

    // GET /api/links/{short} - fetch info (for frontend display/analytics)
    public function show(string $short)
    {
        $link = Link::where('short_code', $short)->withCount('visits')->first();
        if (!$link) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json([
            'short_code' => $link->short_code,
            'original_url' => $link->original_url,
            'visits_count' => $link->visits_count, // live counter
            'created_at' => $link->created_at,
        ]);
    }
}
