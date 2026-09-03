<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DigitalResource extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'category',
        'description',
        'file_url',
        'file_type',
        'file_size_mb',
    ];

    protected function casts(): array
    {
        return [
            'file_size_mb' => 'decimal:2',
        ];
    }
}
