"use client";

import useDeepResearchProcessStore from "@/store/deepResearchProcessStore";

const DeepResearchProcess = () => {
  const { simpleAnalysis, tasks, report } = useDeepResearchProcessStore();
  return (
    <div className="h-screen w-3xl bg-sky-300 flex flex-col overflow-y-scroll">
      <div>{simpleAnalysis}</div>
      {tasks.map((task) => {
        return <text>{task.description}</text>;
      })}
      {tasks.map((task) => {
        return <text>{task.result}</text>;
      })}
    </div>
  );
};

export default DeepResearchProcess;
