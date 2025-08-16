import { reactive } from 'vue';

export default reactive<{
    invocations: number,
    progress: number,
    file: File | null,
}>({
    invocations: 0,
    progress: -1,
    file: null,
});    

