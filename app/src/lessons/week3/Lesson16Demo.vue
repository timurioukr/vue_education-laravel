<script setup lang="ts">
import MemoryCard from '@/components/interactive/MemoryCard.vue'
import TerminalOutput from '@/components/interactive/TerminalOutput.vue'

defineProps<{
  activeTab: string
}>()

const memoryItems = [
  { vue: 'new FormData(); fd.append("file", f)', laravel: "$request->file('attachment')" },
  {
    vue: 'file.name / file.size / file.type',
    laravel: 'getClientOriginalName/getSize/getMimeType',
  },
  { vue: 'accept=".jpg,.png" (підказка!)', laravel: "validate: 'mimes:jpg,png|max:10240'" },
  { vue: '<img :src="user.avatarUrl">', laravel: "Storage::disk('public')->url(\\$path)" },
  { vue: 'URL.createObjectURL(file)', laravel: "$file->store('avatars', 'public')" },
  { vue: 'Vite public/ — статичні файли', laravel: 'php artisan storage:link → public/storage' },
]

const curlOutput = [
  '# 1) Завантажити файл (multipart/form-data)',
  '$ curl -X POST localhost:8000/api/tasks/1/attachments \\',
  '    -H "Authorization: Bearer $TOKEN" \\',
  '    -F "attachment=@./report.pdf" | jq .',
  '',
  '{',
  '  "data": {',
  '    "id": 7,',
  '    "original_name": "report.pdf",',
  '    "mime_type":     "application/pdf",',
  '    "size":          204800,',
  '    "human_size":    "200 KB",',
  '    "is_image":      false,',
  '    "url":           "http://localhost:8000/storage/attachments/a1b2c3d4e5f6.pdf"',
  '  }',
  '}',
  '',
  '# 2) Валідація відхиляє .exe',
  '$ curl -X POST localhost:8000/api/tasks/1/attachments \\',
  '    -H "Authorization: Bearer $TOKEN" \\',
  '    -F "attachment=@./malware.exe" | jq .',
  '',
  '{',
  '  "message": "The attachment field must be a file of type: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip.",',
  '  "errors": { "attachment": ["..."] }',
  '}',
  '',
  '# 3) Скачати з оригінальним імʼям',
  '$ curl -OJ localhost:8000/api/tasks/1/attachments/7 \\',
  '    -H "Authorization: Bearer $TOKEN"',
  '$ ls -la report.pdf       ← Content-Disposition підказав браузеру',
  '',
  '# 4) Видалити',
  '$ curl -X DELETE localhost:8000/api/tasks/1/attachments/7 \\',
  '    -H "Authorization: Bearer $TOKEN" -w "%{http_code}\\n"',
  '204',
  '',
  '# 5) ⚠️ Без storage:link — публічний URL дає 404',
  '$ php artisan storage:link',
  'The [public/storage] link has been connected to [storage/app/public].',
]
</script>

<template>
  <div class="demo-content">
    <MemoryCard :items="memoryItems" />
    <TerminalOutput :lines="curlOutput" title="Storage у дії: upload → 422 → download → delete" />
  </div>
</template>

<style scoped>
.demo-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
