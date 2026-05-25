import type { EntityId, Task } from '@/entities/project/@x/task';
import { baseApi, toQueryResult } from '@/shared/api';

import { taskApi, type DeletedTaskResult, type TaskMutationResult, type TaskPayload } from './task-api';

const dashboardTag = { type: 'Dashboard' as const, id: 'PROJECTS' };
const projectListTag = { type: 'Project' as const, id: 'LIST' };
const reviewListTag = { type: 'Review' as const, id: 'LIST' };

interface TaskIdArg {
  projectId: EntityId;
  taskId: EntityId;
}

interface CreateTaskArg {
  projectId: EntityId;
  payload: TaskPayload;
}

interface UpdateTaskArg {
  projectId?: EntityId;
  taskId: EntityId;
  payload: Partial<TaskPayload>;
}

type DeleteTaskArg = EntityId | { projectId?: EntityId; taskId: EntityId };

const getTaskId = (arg: DeleteTaskArg): EntityId => (typeof arg === 'object' ? arg.taskId : arg);

const getProjectId = (arg: DeleteTaskArg): EntityId | undefined =>
  typeof arg === 'object' ? arg.projectId : undefined;

export const taskApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTaskById: build.query<Task, TaskIdArg>({
      queryFn: ({ projectId, taskId }) => toQueryResult(() => taskApi.getTaskById(projectId, taskId)),
      providesTags: (_result, _error, { projectId, taskId }) => [
        { type: 'Task' as const, id: taskId },
        { type: 'Project' as const, id: projectId },
      ],
    }),
    createTask: build.mutation<TaskMutationResult, CreateTaskArg>({
      queryFn: ({ projectId, payload }) => toQueryResult(() => taskApi.createTask(projectId, payload)),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project' as const, id: projectId },
        { type: 'Task' as const, id: `PROJECT-${projectId}` },
        dashboardTag,
      ],
    }),
    updateTask: build.mutation<Task, UpdateTaskArg>({
      queryFn: ({ taskId, payload }) => toQueryResult(() => taskApi.updateTask(taskId, payload)),
      invalidatesTags: (_result, _error, { taskId, projectId }) => [
        { type: 'Task' as const, id: taskId },
        ...(projectId
          ? [
              { type: 'Project' as const, id: projectId },
              { type: 'Task' as const, id: `PROJECT-${projectId}` },
            ]
          : []),
        reviewListTag,
      ],
    }),
    deleteTask: build.mutation<DeletedTaskResult, DeleteTaskArg>({
      queryFn: (arg) => toQueryResult(() => taskApi.deleteTask(getTaskId(arg))),
      invalidatesTags: (_result, _error, arg) => {
        const taskId = getTaskId(arg);
        const projectId = getProjectId(arg);

        return [
          { type: 'Task' as const, id: taskId },
          ...(projectId
            ? [
                { type: 'Project' as const, id: projectId },
                { type: 'Task' as const, id: `PROJECT-${projectId}` },
              ]
            : []),
          projectListTag,
          dashboardTag,
        ];
      },
    }),
  }),
});

export const { useCreateTaskMutation, useDeleteTaskMutation, useGetTaskByIdQuery, useUpdateTaskMutation } =
  taskApiSlice;
