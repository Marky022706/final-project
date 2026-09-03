<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DigitalReadingHistory extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'digital_reading_history';

    protected $fillable = [
        'user_id',
        'resource_id',
        'read_duration_seconds',
        'last_accessed',
    ];

    protected function casts(): array
    {
        return [
            'last_accessed' => 'datetime',
            'read_duration_seconds' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function resource()
    {
        return $this->belongsTo(DigitalResource::class, 'resource_id', 'id');
    }
}
