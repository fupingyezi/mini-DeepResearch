"use client";

import useDeepResearchProcessStore from "@/store/deepResearchProcessStore";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Image from "next/image";
import { taskType } from "@/types";
import {
  CheckCircleOutlined,
  LoadingOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { parseSearchResult } from "@/utils/streamUtils";

export const Title: React.FC<{ title: string; className?: string }> = ({
  title,
  className,
}) => {
  return (
    <div className={`font-semibold text-gray-800 ${className}`}>{title}</div>
  );
};

export const DeepResearchSearchProcessItem: React.FC<{
  task: taskType;
  isShow: boolean;
}> = ({ task, isShow }) => {
  if (!isShow) return null;

  return (
    <div className="w-full mt-4 p-4">
      <div className="flex gap-2">
        <div>
          {task.result ? (
            <CheckCircleOutlined style={{ color: "green" }} />
          ) : (
            <LoadingOutlined />
          )}
        </div>
        <Title title={task.description} />
      </div>
      <div className="pl-6 mt-4">
        <Markdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {task.result}
        </Markdown>
        <div className="bg-[#f4f4f4] rounded-xl p-3 mt-2">
          {task.searchResult && task.searchResult.length > 0 ? (
            <ul className="space-y-1.?('text-xs') text-gray-700  list-none">
              {task.searchResult.map((item, idx) => {
                const displayTitle = item.title || "未命名页面";
                return (
                  <a
                    key={idx}
                    href={item.sourceUrl}
                    target="_blank"
                    title={`来源: ${item.sourceUrl}`}
                  >
                    <li
                      key={idx}
                      className="flex items-center justify-between py-1 text-gray-500 hover:text-blue-600 hover:cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium truncate max-w-[80%]">
                        {displayTitle}
                      </span>

                      <ArrowUpOutlined rotate={45} />
                    </li>
                  </a>
                );
              })}
            </ul>
          ) : (
            <div className="text-xs text-gray-500 italic">暂无相关搜索结果</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DeepResearchProcess = () => {
  const {
    isOpenProcessSider,
    researchTarget,
    tasks,
    report,
    setIsOpenProcessSider,
  } = useDeepResearchProcessStore();
  if (!isOpenProcessSider) return null;

  return (
    <div className="h-screen w-6xl px-4 flex flex-col overflow-y-scroll relative border-l-2 border-[#f3f3f3]">
      {/* header */}
      <div className="w-full sticky top-0 flex justify-between items-center py-2 bg-white z-10">
        <div className="w-[70%] text-xl font-bold">课题：{researchTarget}</div>
        <Image
          className="cursor-pointer"
          src="/close.svg"
          width={30}
          height={30}
          alt="关闭"
          onClick={() => setIsOpenProcessSider(false)}
        />
      </div>

      {/* outline */}
      {tasks.length !== 0 && (
        <div className="w-full mt-4 p-4 space-y-2 bg-[#f4f4f4] rounded-xl">
          <div className="flex">
            <div>
              <Title title="🔍生成大纲并按需搜索互联网公开信息" />
              <ul className="mt-1.5 space-y-1.5 pl-8">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="text-sm text-gray-600 list-item list-disc marker:text-gray-400"
                  >
                    {task.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex">
            <Title title="💡根据搜索到的内容进行分析" />
          </div>

          <div className="flex">
            <Title title="📄生成分析研究报告" />
          </div>
        </div>
      )}

      {/* research */}
      {tasks.length !== 0 && (
        <div className="w-full flex flex-col">
          {tasks.map((task, index) => (
            <DeepResearchSearchProcessItem
              key={task.id}
              task={task}
              isShow={index === 0 || tasks[index - 1].result !== ""}
            />
          ))}
          {tasks.every((task) => task.result) && !report && (
            <div className="w-full flex items-center mt-3">
              <LoadingOutlined />
              <Title title="正在生成最终报告"></Title>
            </div>
          )}
        </div>
      )}

      {/* report */}
      {report && (
        <div className="w-full flex flex-col gap-3 border-t-2 border-[#f4f4f4] py-4">
          <Title title="最终报告结果" className="font-bold text-2xl"></Title>
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {report}
          </Markdown>
        </div>
      )}
    </div>
  );
};

export default DeepResearchProcess;
