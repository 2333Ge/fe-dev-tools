export type IStoppablePromiseRes<T> = {
  promise: Promise<T>;
  stop: () => void;
};

export function stoppablePromise<T>(
  promiseFunction: () => Promise<T>
): IStoppablePromiseRes<T> {
  let stopped = false;
  let stopFunc: () => void;

  const stopPromise = new Promise((resolve, reject) => {
    stopFunc = () => {
      stopped = true;
      reject("Promise stopped");
    };
  });

  const mainPromise = new Promise(async (resolve, reject) => {
    try {
      const result = await Promise.race([promiseFunction(), stopPromise]);
      if (!stopped) {
        resolve(result);
      }
    } catch (error) {
      reject(error);
    }
  });

  const stop = () => {
    if (!stopped) {
      stopFunc();
    }
  };

  return {
    promise: mainPromise as Promise<T>,
    stop: stop,
  };
}
