<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@gby/task-pool](./task-pool.md) &gt; [TaskReturnType\_Default](./task-pool.taskreturntype_default.md)

## TaskReturnType\_Default type

在默认执行器 default\_Executor 的情况下，任务的返回类型

<b>Signature:</b>

```typescript
export declare type TaskReturnType_Default<T> = T extends (...args: any) => infer R ? R : T;
```