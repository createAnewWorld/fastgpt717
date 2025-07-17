import React, { useState, useEffect } from 'react';
import { useChatBox } from '@/components/core/chat/ChatContainer/ChatBox/hooks/useChatBox';
import type { ChatItemType } from '@fastgpt/global/core/chat/type.d';
import { Box, IconButton } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import MyIcon from '@fastgpt/web/components/common/Icon';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import { useRouter } from 'next/router';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';

// 安全获取 Cookie
const getCookie = (name: string): string => {
  if (typeof document === 'undefined') return ''; // 服务器端渲染时返回空字符串
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(';').shift() || '' : '';
};

const ToolMenu = ({ history }: { history: ChatItemType[] }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { onExportChat } = useChatBox();

  // 获取 fastgptKey（确保只在客户端获取）
  const [fastgptKey, setFastgptKey] = useState('');

  useEffect(() => {
    setFastgptKey(getCookie('FastgptKeyusername'));
  }, []);

  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);
  // 从上下文中获取必要的方法和数据
  const onClearHistory = useContextSelector(ChatContext, (v) => v.onClearHistories);
  const chatData = useContextSelector(ChatItemContext, (v) => v.chatBoxData);
  const showRouteToAppDetail = useContextSelector(ChatItemContext, (v) => v.showRouteToAppDetail);
  const handleLogout = () => {
    // 清除本地存储
    localStorage.clear();
    sessionStorage.clear();
    // 跳转到指定 IP 地址
    // window.location.replace('http://121.37.224.213:13090');
    // window.location.replace('http://192.168.10.125');
    window.location.replace('http://192.168.1.3:13090');
    // window.location.replace('http://192.168.10.92:13090');
    // window.location.replace('https://alex.csic.cn/login');
  };

  const { openConfirm, ConfirmModal } = useConfirm({
    title: '操作确认',
    content: '确认删除所有聊天记录？' // 修改了确认内容
  });

  return (
    <>
      <MyMenu
        Button={
          <IconButton
            icon={<MyIcon name={'more'} w={'14px'} p={2} />}
            aria-label={''}
            size={'sm'}
            variant={'whitePrimary'}
          />
        }
        // menuList={[
        //   {
        //     children: [
        //       {
        //         icon: 'core/chat/chatLight',
        //         label: t('common:core.chat.New Chat'),
        //         onClick: () => {
        //           onChangeChatId();
        //         }
        //       }
        //     ]
        //   },
        //   {
        //     children: [
        //       // {
        //       //   icon: 'core/app/appApiLight',
        //       //   label: `HTML ${t('common:Export')}`,
        //       //   onClick: () => onExportChat({ type: 'html', history })
        //       // },
        //       {
        //         icon: 'file/markdown',
        //         label: `Markdown ${t('common:Export')}`,
        //         onClick: () => onExportChat({ type: 'md', history })
        //       }
        //       // {
        //       //   icon: 'core/chat/export/pdf',
        //       //   label: `PDF ${t('common:Export')}`,
        //       //   onClick: () => onExportChat({ type: 'pdf', history })
        //       // }
        //     ]
        //   },
        //   ...(showRouteToAppDetail
        //     ? [
        //         {
        //           children: [
        //             {
        //               icon: 'core/app/aiLight',
        //               label: t('app:app_detail'),
        //               onClick: () => router.push(`/app/detail?appId=${chatData.appId}`)
        //             }
        //           ]
        //         }
        //       ]
        //     : [])
        // ]}

        menuList={[
          {
            children: [
              {
                icon: 'common/addUser',
                label: fastgptKey || '未找到 FastGPT Key'
              }
            ]
          },
          {
            children: [
              {
                icon: 'file/markdown',
                label: `${t('common:Export')}当前对话`,
                onClick: () => onExportChat({ type: 'md', history })
              }
            ]
          },
          {
            children: [
              {
                icon: 'delete',
                label: '清除历史对话',
                onClick: openConfirm(() => {
                  onClearHistory();
                })
              }
            ]
          },
          {
            children: [
              {
                icon: 'support/account/loginoutLight',
                label: '退出登录',
                onClick: handleLogout // 直接传递函数，不需要箭头函数
              }
            ]
          },
          ...(showRouteToAppDetail
            ? [
                {
                  children: [
                    {
                      icon: 'core/app/aiLight',
                      label: t('app:app_detail'),
                      onClick: () => router.push(`/app/detail?appId=${chatData.appId}`)
                    }
                  ]
                }
              ]
            : [])
        ]}
      />
      <ConfirmModal /> {/* 添加这行以渲染确认弹框 */}
    </>
  );
};

export default ToolMenu;
