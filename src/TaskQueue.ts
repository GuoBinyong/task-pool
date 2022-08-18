
import {TaskPool,TaskPoolOptions} from "./TaskPool";

/**
 * 任务优先级比较函数
 */
type CompareFn<Task> = (a: Task, b: Task) => number;



export interface TaskQueueOptions<Task> extends TaskPoolOptions<Task> {
    /**
     * 任务队列
     */
     tasks?:Task[]|null;


    /**
     * 优先级比较函数
     * @remarks
     * 用于给任务优先级排序的比较函数，与 数组的 sort() 方法接收的函数一样
     */
    compareFn?: CompareFn<Task> | null;
     
 }
 


/**
 * 任务池
 */
export class TaskQueue<Task = any> extends TaskPool<Task>{

    constructor(options?:TaskQueueOptions<Task>|null){
        super(options);
    }

    /**
     * 任务队列
     */
    get tasks(){
        return this._tasks ?? (this._tasks = []);
    }
    set tasks(value){
        this._tasks = value;
        if (value){
            this.tasksChanged();
        }
    }
    protected _tasks?:Task[]|null;

    /**
     * 优先级比较函数
     * @remarks
     * 用于给任务优先级排序的比较函数，与 数组的 sort() 方法接收的函数一样
     */
    compareFn?: CompareFn<Task> | null;

    /**
     * 根据任务优先级排序
     */
    protected sort(){
        const compareFn = this.compareFn;
        if (compareFn){
            this.tasks.sort(compareFn)
        }
    }

    /**
     * 任务队列改变了
     */
    protected tasksChanged(){
        this.sort();
        this.start();
    }


    protected nextTask(): IteratorResult<Task, any> {
        const tasks = this.tasks;
        const task = this.tasks.shift();
        return {done: tasks.length > 0,value:task} as IteratorResult<Task, any>;
    }






    /**
     * 添加任务
     * @param tasks 
     */
    add(...tasks: Task[]) {
        this.tasks.push(...tasks);
        this.tasksChanged();
    }

    /**
     * 移除任务
     * @param task 
     * @returns 
     */
    remove(task: Task){
        const tasks = this.tasks;
        const index = tasks.indexOf(task);
        if (index === -1) return false;
        tasks.splice(index, 1);
        return true;
    }

    /**
     * 判断任务池中是否包含指定任务
     * @param task 
     * @returns 
     */
    has(task: Task) {
       return this.tasks.includes(task);
    }

    
}