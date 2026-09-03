<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'accession_number',
        'title',
        'author',
        'publisher',
        'isbn',
        'category',
        'year',
        'shelf_location',
        'format',
        'book_condition',
        'description',
        'cover_image',
        'total_copies',
        'available_copies',
        'qr_code',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'total_copies' => 'integer',
            'available_copies' => 'integer',
        ];
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'book_id', 'id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'book_id', 'id');
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class, 'book_id', 'id');
    }
}
