/**
 * 库的摘要信息
 * 
 * @remarks
 * 库的说明信息
 * 
 * @packageDocumentation
 */


/**
 * 任务的返回类型
 */
export type TaskReturnType<T> = T extends (...args: any) => infer R ? R : T;
/**
 * 任务的执行结果
 */
export type TaskResult<T> = TaskReturnType<T> extends Promise<infer Res> ? Res : T;

/**
 * 任务完成的回调函数
 */
export type TaskCompleted<Task> = (result:TaskResult<Task>|undefined,error:any,task:Task)=>void;

/**
 * 任务池清空的回市函数
 */
export type PoolEmptied<Task> = (taskPool:TaskPool<Task>)=>void;


/**
 * TaskPool 构造函数选项
 */
export interface TaskPoolOptions<Task> {
    /**
     * 任务完成回调
     */
     completed?:TaskCompleted<Task> | null;

     /**
      * 任务池清空时的回调
      */
     emptied?:PoolEmptied<Task>|null;

    /**
     * 最大并行执行数目
     */
     maxExecNum?:number|null;

     /**
      * 任务列表
      */
     tasks?:Task[]|null;
 
}




/**
 * 任务池
 */
export class TaskPool<Task = any> {

    constructor(options?:TaskPoolOptions<Task>|null){
        if (!options) return;

        const {tasks,...otherOpts} = options;
        Object.assign(this,otherOpts);
        if (tasks){
            this.add(...tasks);
        }
    }

    /**
     * 任务完成回调
     */
    completed?:TaskCompleted<Task> | null;

    /**
     * 任务池清空时的回调
     */
    emptied?:PoolEmptied<Task>|null;

    /**
     * 最大并行执行数目
     */
    protected _maxExecNum?:null;
    get maxExecNum(){
        return this._maxExecNum ?? 10;
    }
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
     * 任务池
     */
    protected _pool:Task[] = [];
    get pool(){
        return this._pool ?? (this._pool = []);
    }


    /**
     * 添加任务
     * @param tasks 
     */
    add(...tasks: Task[]) {
        this.pool.push(...tasks);
        this.exec();
    }

    /**
     * 移除任务
     * @param task 
     * @returns 
     */
    remove(task: Task){
        const pool = this.pool;
        const index = pool.indexOf(task);
        if (index === -1) return false;
        pool.splice(index, 1);
        return true;
    }


    
    /**
     * 执行任务
     */
    protected exec(){
        const pool = this.pool;
        const completed = this.completed;
        while (this.isStart && this.idleNum > 0 ){
            if (pool.length === 0){
                this.emptied?.(this);
                return;
            }
            const task = pool.pop()!;
            this.execNum++;
            let taskResult;
            try {
                taskResult = typeof task === 'function' ? task() : task;
            }catch (e) {}
            taskResult = taskResult instanceof Promise ? taskResult : Promise.resolve(taskResult);

            const completeTask = (result:TaskResult<Task>|undefined ,error:any)=>{
                this.execNum--;
                if (completed){
                    try {
                        completed(result,error,task)
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
     * 是否开始执行池中的任务
     */
    isStart = false;

    /**
     * 开始执行任务
     */
    start(){
        this.isStart = true;
        this.exec();
    }

    /**
     * 暂停执行任务
     */
    pause(){
        this.isStart = false;
    }

    
}