import { HTTPRequestFactory } from "./HTTPRequestFactory.js";

interface Dog {
    name: string;
    age: number;
}

const f = new HTTPRequestFactory()
    .withWrappedResponseError();

const req = f.createGETRequest('https://jsonplaceholder.typicode.com/posts/1');

(async () => {
    const {response, error} = await req.execute<Dog>();
    console.log(response?.age, error);
})();
    