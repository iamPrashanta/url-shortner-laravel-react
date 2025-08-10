<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Link extends Model
{
    protected $fillable = [
        'short_code',
        'original_url',
        'visits_count',
    ];

    public function visits()
    {
        return $this->hasMany(Visit::class);
    }
}
