## DEMO: File Upload

This demo shows how to upload a file using APIHive and tracking it's progress.


<script setup>
import FileUploadProgress from './FileUploadProgress.vue'
</script>

<ClientOnly>

<FileUploadProgress />

</ClientOnly>

### Code

::: code-group

<<< ./file-upload-controller.ts{10,26-32}
<<< ./FileUploadProgress.vue
<<< ./file-upload-model.ts
:::
