<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    public static function log(
        string $action,
        string $targetType,
        ?int   $targetId = null,
        ?array $before = null,
        ?array $after = null,
    ): AuditLog {
        return AuditLog::create([
            'actor_user_id' => Auth::id(),
            'action'        => $action,
            'target_type'   => $targetType,
            'target_id'     => $targetId,
            'before_json'   => $before,
            'after_json'    => $after,
            'ip'            => request()->ip(),
            'created_at'    => now(),
        ]);
    }
}