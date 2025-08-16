import model from './file-upload-model';
import { HTTPRequestFactory, type ProgressInfo } from '../../../src';
import uploadProgress from '../../../src/features/upload-progress';

export type Aborter = () => void;

class FileUploadController {
    abortController: AbortController | null = null;
    requestFactory = new HTTPRequestFactory()
        .use(uploadProgress);

    onFileChange(file: File) {
        model.file = file;
        model.invocations = 0;
        model.progress = -1;
    }
      
    uploadFile() : Aborter {
        model.invocations = 0;
        model.progress = 0;
        const request = this.requestFactory
          .createPOSTRequest('https://httpbin.org/anything')
          .withFormDataBody((formData: FormData) => {
            formData.append('file', model.file!);
          })
          .withProgressHandlers({
            upload: (info: ProgressInfo) => {
              model.progress = info.percentProgress;
              model.invocations++;
            },
            throttleMs: 10, //limits the number of events sent
          })
          .withAbortListener(() => {
            model.progress = -1;
            this.abortController = null;
          });
          request.execute();
          return  () => request.abortController.abort();
      };
}

export default new FileUploadController();
