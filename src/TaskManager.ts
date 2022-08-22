import {TaskPool,TaskPoolOptions} from "./TaskPool"
 
 
/**
 * 获取要执行的任务
 */
 export type GetTask<Task> = (taskManager:TaskManager)=>IteratorResult<Task>;

 export interface TaskManagerOptions<Task,Result> extends TaskPoolOptions<Task,Result> {
    /**
     * 获取要执行的任务的回市函数
     */
    getTask?:GetTask<Task>|null;
 }
 
 
 
 /**
  * 任务池
  */
 export class TaskManager<Task = any,Result = any> extends TaskPool {

    constructor(options?:TaskManagerOptions<Task,Result>){
        super(options);
        if (options){
            this._getTask = options.getTask;
        }
    }


    /**
     * 获取任务的回调函数
     */
    get getTask(){
        return this._getTask;
    }
    
    set getTask(value){
        this._getTask = value;
        this.start();
    }
    protected _getTask?:GetTask<Task>|null;

    /**
     * 获取下一个任务
     */
    protected nextTask():IteratorResult<Task> {
        const getTask = this.getTask;
        return getTask ? getTask(this) : {done:true,value:undefined};
    }
     
     
 }