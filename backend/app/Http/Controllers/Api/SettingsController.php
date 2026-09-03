<?php

namespace App\Http\Controllers\Api;

use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends BaseApiController
{
    public function get(Request $request): JsonResponse
    {
        $settingsList = SystemSetting::all();
        $mapped = [];
        foreach ($settingsList as $s) {
            $mapped[$s->setting_key] = $s->setting_value;
        }

        return $this->success($mapped, 'System configurations retrieved.');
    }

    public function update(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return $this->error('Only administrators can update library configurations.', 403);
        }

        $input = $request->all();

        foreach ($input as $key => $val) {
            if (is_scalar($val)) {
                SystemSetting::updateOrCreate(
                    ['setting_key' => $key],
                    ['setting_value' => (string)$val]
                );
            }
        }

        $this->logActivity(
            $currentUser->id,
            'settings_update',
            'System Settings',
            "Updated municipal library operational parameters",
            $request
        );

        return $this->success(null, 'Library settings updated successfully.');
    }
}
