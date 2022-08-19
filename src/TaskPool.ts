/**
 * 库的摘要信息
 * 
 * @remarks
 * 库的说明信息
 * 
 * @packageDocumentation
 */



 
 /**
  * 任务完成的回调函数
  */
 export type TaskCompleted<Result,Task,TP extends TaskPool<Task> = TaskPool<Task>> = (result:Result|undefined,error:any,task:Task,taskPool:TP)=>void;
 
 /**
  * 任务池清空的回市函数
  */
 export type PoolEmptied<TP extends TaskPool = TaskPool> = (taskPool:TP)=>void;


 export type TaskExecutor<Task,Result,TP extends TaskPool<Task> = TaskPool<Task>> = (task:Task,taskPool:TP)=>Result;
 
 
 /**
  * TaskPool 的构造函数选项
  */
 export interface TaskPoolOptions<Task,Result,TP extends TaskPool<Task> = TaskPool<Task>> {
     /**
      * 任务完成回调
      */
      completed?:TaskCompleted<Task,TP> | null;
 
      /**
       * 任务池清空时的回调
       */
      emptied?:PoolEmptied<TP>|null;
 
     /**
      * 最大并行执行数目
      */
      maxExecNum?:number|null;
      
      /**
       * 任务执行者
       */
      executor?:TaskExecutor<Task,Result,TP>|null;
  
 }
 



/**
 * 默认的任务执行者
 * 
 * @remarks
 * 执行的逻辑是：
 * - 如果任务是函数，则执行该函数，并将函数结果作为执行结果，否则，将其视为数据，直接将任务本身作为执行结果
 * @param task 
 * @returns 
 */
export function default_Executor<Task>(task:Task):TaskReturnType_Default<Task>|undefined {
    try {
        return typeof task === 'function' ? task() : task;
    }catch (e) {}
}

/**
 * 在默认执行器 default_Executor 的情况下，任务的返回类型
 */
 export type TaskReturnType_Default<T> = T extends (...args: any) => infer R ? R : T;
 /**
  * 在默认执行器 default_Executor 的情况下，任务的执行结果
  */
 export type TaskResult_Default<T> = TaskReturnType_Default<T> extends Promise<infer Res> ? Res : T;



 
 /**
  * 任务池
  */
 export abstract class TaskPool<Task = any,Result = any> {
 
     constructor(options?:TaskPoolOptions<Task,Result,TaskPool<Task>>|null){
         if (!options) return;
         Object.assign(this,options);
     }
 
     /**
      * 任务完成回调
      */
     completed?:TaskCompleted<Result,Task,this> | null;
 
     /**
      * 任务池清空时的回调
      */
     emptied?:PoolEmptied<this>|null;


     /**
      * 任务执行者
      * 
      * @remarks
      * 用户可以自定义任务的执行逻辑
      */
     executor?:TaskExecutor<Task,Result,this>|null;
 
     /**
      * 最大并行执行数目
      */
     get maxExecNum() {
         return this._maxExecNum ?? 10;
     }
     set maxExecNum(value) {
         this._maxExecNum = value;
     }
     protected _maxExecNum?: number | null;
     /**
      * 当前的任务执行数目
      */
     execNum = 0;
 
     /**
      * 执行队列是否是空闲状态
      */
     get isIdle(){
         return this.execNum < this.maxExecNum
     }
     
     /**
      * 执行队列是否已满
      */
     get isFull(){
         return !this.isIdle;
     }
 
     /**
      * 队列空闲数目
      */
     get idleNum (){
         return this.maxExecNum - this.execNum;
     }
 
     


     /**
      * 获取下一个任务
      */
     protected abstract nextTask():IteratorResult<Task>;

     /**
      * 执行任务
      * @param task 
      * @returns 
      */
     protected execTask(task:Task){
        this.execNum++;
        const executor = this.executor ?? default_Executor;
        const result = executor(task,this);
        return result instanceof Promise ? result : Promise.resolve(result);
     }

     

     /**
      * 判断当前是否需要继续执行
      */
     protected get needExec(){
        return this.isLaunched && this.isExecuting && this.idleNum > 0;
     }
     
     /**
      * 执行任务
      */
     protected exec(){
         const completed = this.completed;
         while (this.needExec){
             const {value:task,done} = this.nextTask();
             if (done){
                this.isExecuting = false;
                this.emptied?.(this);
                return;
             }

             const taskResult = this.execTask(task);
             const completeTask = (result:Result|undefined ,error:any)=>{
                 this.execNum--;
                 if (completed){
                     try {
                         completed(result,error,task,this);
                     }catch (e) {}
                 }
                 this.exec();
             };
 
             taskResult.then(completeTask as any,(error)=>{
                 completeTask(undefined,error);
             });
         }
     }
 
 


     /**
      * 是否正在执行
      */
     isExecuting = false;
 
     /**
      * 开始执行任务
      */
     start(){
        if (this.isExecuting || !this.isLaunched) return;
        this.isExecuting = true;
        this.exec();
     }
 
     /**
      * 暂停执行任务
      */
     pause(){
         this.isExecuting = false;
     }

     /**
      * 是否已启动
      */
     isLaunched = false;

     /**
      * 启动
      */
     launch(){
        this.isLaunched = true;
        this.start();
     }

     /**
      * 停止
      */
     stop(){
        this.isLaunched = false;
     }
 
     
 }