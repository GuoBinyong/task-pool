/**
 * 库的摘要信息
 * 
 * @remarks
 * 库的说明信息
 * 
 * @packageDocumentation
 */

 type TaskReturnType<T> = T extends (...args: any) => infer R ? R : T;
 type TaskResult<T> = TaskReturnType<T> extends Promise<infer Res> ? Res : T;

type TaskCompleted<Task> = (result:TaskResult<Task>|undefined,error:any,task:Task)=>void;
type PoolEmptied<Task> = (taskPool:TaskPool<Task>)=>void;



/**
 * 任务池
 */
export class TaskPool<Task = any> {

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
    pool:Task[] = [];

    /**
     * 添加任务
     * @param tasks 
     */
    add(...tasks: Task[]) {
        this.pool.push(...tasks);
        this.exec();
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