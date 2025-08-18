import { reactive } from 'vue';

interface Update {
    timestamp: string;
    title: string;
    id: number;
}

export default reactive<{
    updates: Update[]
    connectionState : 'disconnected' | 'connecting' | 'connected',
    error: string
}>({
    updates: [],
    connectionState : 'disconnected',
    error: ''
})