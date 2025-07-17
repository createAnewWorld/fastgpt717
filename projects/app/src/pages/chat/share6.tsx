import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Drawer, DrawerOverlay, DrawerContent } from '@chakra-ui/react';
import { streamFetch } from '@/web/common/api/fetch';
import SideBar from '@/components/SideBar';
import { GPTMessages2Chats } from '@fastgpt/global/core/chat/adapt';

import ChatBox from '@/components/core/chat/ChatContainer/ChatBox';
import type { StartChatFnProps } from '@/components/core/chat/ChatContainer/type';

import PageContainer from '@/components/PageContainer';
import ChatHeader from '@/pageComponents/chat/ChatHeader';
import ChatHistorySlider from '@/pageComponents/chat/ChatHistorySlider';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { useTranslation } from 'next-i18next';
import { getInitOutLinkChatInfo } from '@/web/core/chat/api';
import { getChatTitleFromChatMessage } from '@fastgpt/global/core/chat/utils';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { addLog } from '@fastgpt/service/common/system/log';
import NextHead from '@/components/common/NextHead';
import { useContextSelector } from 'use-context-selector';
import ChatContextProvider, { ChatContext } from '@/web/core/chat/context/chatContext';
import { GetChatTypeEnum } from '@/global/core/chat/constants';
import { useMount } from 'ahooks';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getNanoid } from '@fastgpt/global/common/string/tools';

import dynamic from 'next/dynamic';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useShareChatStore } from '@/web/core/chat/storeShareChat';
import ChatItemContextProvider, { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import ChatRecordContextProvider, {
  ChatRecordContext
} from '@/web/core/chat/context/chatRecordContext';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { useI18nLng } from '@fastgpt/web/hooks/useI18n';
import { type AppSchema } from '@fastgpt/global/core/app/type';
import { log } from 'console';
import { Spinner, Text, Image } from '@chakra-ui/react';
import { Button } from '@chakra-ui/react';
import ChatQuoteList from '@/pageComponents/chat/ChatQuoteList';
import { useToast } from '@fastgpt/web/hooks/useToast';

import { createContext } from 'react';
import { MessageProvider, useMessageContext } from '@/context/MessageContext';
const CustomPluginRunBox = dynamic(() => import('@/pageComponents/chat/CustomPluginRunBox'));
// 定义一个上下文
export const MessageContext = createContext({});

type Props = {
  appId: string;
  appName: string;
  appIntro: string;
  appAvatar: string;
  shareId: string;
  authToken: string;
  customUid: string;
  showRawSource: boolean;
  showNodeStatus: boolean;
};

// 添加蓝色小人组件
const BlueCharacter = () => {
  return (
    <Box position="fixed" bottom="150px" right="100px" zIndex={10} width="60px" height="60px">
      <Image
        src="https://amac8.oss-cn-guangzhou.aliyuncs.com/blue-character.png"
        alt="Blue Character"
        width="100%"
        height="100%"
      />
    </Box>
  );
};

const OutLink = (props: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    shareId = '',
    showHistory = '1',
    showHead = '1',
    authToken,
    customUid,
    ...customVariables
  } = router.query as {
    shareId: string;
    showHistory: '0' | '1';
    showHead: '0' | '1';
    authToken: string;
    [key: string]: string;
  };
  const { isPc } = useSystem();
  const { outLinkAuthData, appId, chatId } = useChatStore();

  const isOpenSlider = useContextSelector(ChatContext, (v) => v.isOpenSlider);
  const onCloseSlider = useContextSelector(ChatContext, (v) => v.onCloseSlider);
  const forbidLoadChat = useContextSelector(ChatContext, (v) => v.forbidLoadChat);
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);
  const onUpdateHistoryTitle = useContextSelector(ChatContext, (v) => v.onUpdateHistoryTitle);

  const resetVariables = useContextSelector(ChatItemContext, (v) => v.resetVariables);
  const isPlugin = useContextSelector(ChatItemContext, (v) => v.isPlugin);
  const setChatBoxData = useContextSelector(ChatItemContext, (v) => v.setChatBoxData);
  const datasetCiteData = useContextSelector(ChatItemContext, (v) => v.datasetCiteData);
  const setCiteModalData = useContextSelector(ChatItemContext, (v) => v.setCiteModalData);
  const isResponseDetail = useContextSelector(ChatItemContext, (v) => v.isResponseDetail);

  const chatRecords = useContextSelector(ChatRecordContext, (v) => v.chatRecords);
  const totalRecordsCount = useContextSelector(ChatRecordContext, (v) => v.totalRecordsCount);
  const isChatRecordsLoaded = useContextSelector(ChatRecordContext, (v) => v.isChatRecordsLoaded);
  // const [customVar1, setCustomVar1] = useState({ deep: 0, selectedValue: 'No_Knowledge' });

  // 定时检查 cookie 中的 authToken
  const checkAuthToken = () => {
    const match = document.cookie.match(new RegExp('(^| )FastgptKey=([^;]+)'));
    const authToken = match ? match[2] : null;

    console.log('authToken:', authToken);

    if (!authToken) {
      // window.location.href = 'http://121.37.224.213:13090/login'; // 为空时跳转
      // window.location.href = 'http://192.168.1.125/login'; // 为空时跳转
      // window.location.href = 'http://192.168.1.3:13090/login'; // 为空时跳转
      // window.location.href = 'http://192.168.10.92:13090/login'; // 为空时跳转
      // window.location.href = 'https://alex.csic.cn/login'; // 为空时跳转
    }
  };

  const [customVar1, setCustomVar1] = useState({
    deep: 0,
    sikao: 0,
    selectedValue: '111111',
    selectedValue2: '3333',
    selectedValue3: '1234'
  });
  // 处理点击事件，切换值
  // const handleToggleVariable = () => {
  //   setCustomVar1((prev) => (prev === 1 ? 2 : 1));
  // };

  // 跳转登录的一个东西
  useEffect(() => {
    // 先执行一次
    checkAuthToken();

    // 每 2 分钟检查一次
    const intervalId = setInterval(checkAuthToken, 160000);

    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, []);

  const [fixedCustomUid, setFixedCustomUid] = useState<string | null>(null);
  const [message, setMessage] = useState(1);

  useEffect(() => {
    async function fetchUserOutLink() {
      try {
        const match = document.cookie.match(new RegExp('(^| )FastgptKey=([^;]+)'));
        const authToken = match ? match[2] : null;

        const res = await fetch(`/api/histories/list?userid=${authToken}`);
        const data = await res.json();
        console.log(data);
        setFixedCustomUid(data.data.outlinksid); // 更新状态
        console.log('fixedCustomUid:', data.data.outlinksid);
      } catch (error) {
        console.error('获取用户 OutLink 失败:', error);
      }
    }

    fetchUserOutLink();
  }, []);

  const initSign = useRef(false);
  const { data, loading } = useRequest2(
    async () => {
      const shareId = outLinkAuthData.shareId;
      const outLinkUid = outLinkAuthData.outLinkUid;
      if (!outLinkUid || !shareId || forbidLoadChat.current) return;

      const res = await getInitOutLinkChatInfo({
        chatId,
        shareId,
        outLinkUid
      });

      setChatBoxData(res);

      resetVariables({
        variables: res.variables,
        variableList: res.app?.chatConfig?.variables
      });

      return res;
    },
    {
      manual: false,
      refreshDeps: [shareId, outLinkAuthData, chatId],
      onFinally() {
        forbidLoadChat.current = false;
      }
    }
  );
  useEffect(() => {
    if (initSign.current === false && data && isChatRecordsLoaded) {
      initSign.current = true;
      if (window !== top) {
        window.top?.postMessage({ type: 'shareChatReady' }, '*');
      }
    }
  }, [data, isChatRecordsLoaded]);

  const startChat = useCallback(
    async ({
      messages,
      controller,
      generatingMessage,
      variables,
      responseChatItemId
    }: StartChatFnProps) => {
      const completionChatId = chatId || getNanoid();
      const histories = messages.slice(-1);

      //post message to report chat start
      window.top?.postMessage(
        {
          type: 'shareChatStart',
          data: {
            question: histories[0]?.content
          }
        },
        '*'
      );

      const { responseText } = await streamFetch({
        data: {
          messages: histories,
          variables: {
            ...variables,
            ...customVariables,
            customVariable1: customVar1.deep, // 添加自定义变量到请求体
            datasets: customVar1.selectedValue || 111111,
            format: customVar1.selectedValue3,
            aigonju: customVar1.selectedValue2,
            web: customVar1.sikao
          },
          responseChatItemId,
          chatId: completionChatId,
          ...outLinkAuthData,
          retainDatasetCite: isResponseDetail
        },
        onMessage: generatingMessage,
        abortCtrl: controller
      });

      const newTitle = getChatTitleFromChatMessage(GPTMessages2Chats(histories)[0]);

      // new chat
      if (completionChatId !== chatId) {
        onChangeChatId(completionChatId, true);
      }
      onUpdateHistoryTitle({ chatId: completionChatId, newTitle });

      // update chat window
      setChatBoxData((state) => ({
        ...state,
        title: newTitle
      }));

      // hook message
      window.top?.postMessage(
        {
          type: 'shareChatFinish',
          data: {
            question: histories[0]?.content,
            answer: responseText
          }
        },
        '*'
      );

      return { responseText, isNewChat: forbidLoadChat.current };
    },
    [
      chatId,
      customVariables,
      outLinkAuthData,
      isResponseDetail,
      onUpdateHistoryTitle,
      setChatBoxData,
      forbidLoadChat,
      onChangeChatId
    ]
  );

  // window init
  const [isEmbed, setIdEmbed] = useState(true);
  useMount(() => {
    setIdEmbed(window !== top);
  });

  const RenderHistoryList = useMemo(() => {
    const Children = (
      <ChatHistorySlider
        confirmClearText={t('common:core.chat.Confirm to clear share chat history')}
      />
    );

    if (showHistory !== '1') return null;

    return isPc ? (
      <SideBar
        sx={{
          backgroundColor: '#1e40af', // 蓝色背景
          borderRight: '1px solid #1d4ed8', // 蓝色边框
          boxShadow: '2px 0px 5px rgba(30, 64, 175, 0.2)', // 蓝色阴影
          '& > *': {
            backgroundColor: '#1e40af !important'
          },
          // 如果有嵌套的 Box 组件
          '& .chakra-box': {
            backgroundColor: '#1e40af !important'
          }
        }}
      >
        {Children}
      </SideBar>
    ) : (
      <Drawer
        isOpen={isOpenSlider}
        placement="left"
        autoFocus={false}
        size={'xs'}
        onClose={onCloseSlider}
      >
        <DrawerOverlay backgroundColor={'rgba(30, 64, 175, 0.5)'} />
        <DrawerContent
          maxWidth={'75vw'}
          boxShadow={'2px 0 10px rgba(30, 64, 175, 0.3)'}
          backgroundColor={'#1e40af'} // 蓝色背景
        >
          {Children}
        </DrawerContent>
      </Drawer>
    );
  }, [isOpenSlider, isPc, onCloseSlider, datasetCiteData, showHistory, t]);

  function UserComponent() {
    // 获取context值
    const { message, setMessage } = useMessageContext();

    setCustomVar1(message as any);

    console.log('1111111', customVar1);

    return (
      <div>
        <p>当前深度: {message.deep}</p>
        <p>选择的值: {message.selectedValue}</p>
      </div>
    );
  }

  return (
    <MessageProvider>
      <div style={{ display: 'none' }}>
        <UserComponent />
      </div>
      <NextHead
        title={props.appName || data?.app?.name || 'AI'}
        desc={props.appIntro || data?.app?.intro}
        icon={props.appAvatar || data?.app?.avatar}
      />
      <PageContainer
        isLoading={loading}
        {...(isEmbed
          ? //取消页面内边距和圆角
            { p: '0 !important', insertProps: { borderRadius: '0', boxShadow: 'none' } }
          : { p: [0, 0], insertProps: { borderRadius: '0', boxShadow: 'none' } })}
        bgColor="#1e40af" // 蓝色背景
      >
        <Flex h={'100%'} flexDirection={['column', 'row']}>
          {RenderHistoryList}

          {/* chat container */}
          <Flex
            position={'relative'}
            h={[0, '100%']}
            w={['100%', 0]}
            flex={'1 0 0'}
            flexDirection={'column'}
            bgColor="#1e40af" // 蓝色背景
          >
            {/* header */}
            {showHead === '1' ? (
              <ChatHeader
                history={chatRecords}
                totalRecordsCount={totalRecordsCount}
                showHistory={showHistory === '1'}
                sx={{
                  backgroundColor: '#1e40af', // 蓝色背景
                  borderBottom: '1px solid #1d4ed8', // 蓝色边框
                  boxShadow: '0 2px 5px rgba(30, 64, 175, 0.2)' // 蓝色阴影
                }}
              />
            ) : null}

            {/* <Button onClick={handleToggleVariable} colorScheme="blue" size="sm" ml={4}>
                当前值: {customVar1}
            </Button> */}

            {/* chat box */}
            <Box
              flex={1}
              bg={'#1e40af'} // 蓝色背景
              shadow="none" // 移除阴影
              sx={{
                '&:hover': {
                  shadow: 'none' // 移除悬停阴影
                },
                '.chat-item': {
                  margin: '16px 0',
                  '.chat-item-content': {
                    borderRadius: '16px',
                    padding: '12px 16px',
                    boxShadow: '0 2px 6px rgba(30, 64, 175, 0.3)',
                    '.message-content': {
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }
                  },
                  '&.user-chat': {
                    '.chat-item-content': {
                      backgroundColor: '#2563eb', // 用户消息深蓝色气泡
                      color: 'white',
                      borderBottomRightRadius: '4px'
                    }
                  },
                  '&.assistant-chat': {
                    '.chat-item-content': {
                      backgroundColor: '#3b82f6', // AI消息中等蓝色气泡
                      color: 'white',
                      borderBottomLeftRadius: '4px'
                    }
                  }
                },
                '.input-box': {
                  borderRadius: '20px',
                  backgroundColor: '#3b82f6', // 蓝色背景
                  boxShadow: '0 2px 10px rgba(30, 64, 175, 0.3)', // 蓝色阴影
                  padding: '4px 12px',
                  '.send-button': {
                    backgroundColor: '#1d4ed8', // 深蓝色按钮
                    borderRadius: '50%',
                    color: 'white'
                  }
                }
              }}
              transition="none" // 移除过渡效果
            >
              {isPlugin ? (
                <CustomPluginRunBox
                  appId={appId}
                  chatId={chatId}
                  outLinkAuthData={outLinkAuthData}
                  onNewChat={() => onChangeChatId(getNanoid())}
                  onStartChat={startChat}
                />
              ) : (
                <ChatBox
                  isReady={!loading}
                  appId={appId}
                  chatId={chatId}
                  outLinkAuthData={outLinkAuthData}
                  feedbackType={'user'}
                  onStartChat={startChat}
                  chatType="share"
                />
              )}
            </Box>
          </Flex>
        </Flex>

        {/* 添加蓝色小人组件 */}
        <BlueCharacter />
      </PageContainer>
    </MessageProvider>
  );
};

const Render = (props: Props) => {
  const { shareId, authToken } = props;
  const { t } = useTranslation();
  const { toast } = useToast();
  // const { shareId, authToken, customUid, appId } = props;
  const { localUId, setLocalUId, loaded } = useShareChatStore();
  const { source, chatId, setSource, setAppId, setOutLinkAuthData } = useChatStore();
  const { setUserDefaultLng } = useI18nLng();

  // const chatHistoryProviderParams = useMemo(() => {
  //   return { shareId, outLinkUid: authToken || customUid || localUId || '' };
  // }, [authToken, customUid, localUId, shareId]);
  // const chatRecordProviderParams = useMemo(() => {
  //   return {
  //     appId,
  //     shareId,
  //     outLinkUid: chatHistoryProviderParams.outLinkUid,
  //     chatId,
  //     type: GetChatTypeEnum.outLink
  //   };
  // }, [appId, chatHistoryProviderParams.outLinkUid, chatId, shareId]);

  // 存放接口返回的 outLinkUid
  const [fixedCustomUid, setFixedCustomUid] = useState<string | null>(null);
  // 用于判断是否正在加载 outLinkUid
  const [loadingUid, setLoadingUid] = useState(true);
  useMount(() => {
    setSource('share');
    setUserDefaultLng(true);
  });

  // Set default localUId
  useEffect(() => {
    if (loaded) {
      if (!localUId) {
        setLocalUId(`shareChat-${Date.now()}-${getNanoid(24)}`);
      }
    }
  }, [loaded, localUId, setLocalUId]);

  // Init outLinkAuthData
  // useEffect(() => {
  //   if (chatHistoryProviderParams.outLinkUid) {
  //     setOutLinkAuthData({
  //       shareId,
  //       outLinkUid: chatHistoryProviderParams.outLinkUid
  //     });
  //   }
  //   return () => {
  //     setOutLinkAuthData({});
  //   };
  // }, [chatHistoryProviderParams.outLinkUid, setOutLinkAuthData, shareId]);

  // // Watch appId
  // useEffect(() => {
  //   setAppId(appId);
  // }, [appId, setAppId]);

  // 这里在组件挂载时请求用户的 outLinkUid
  useEffect(() => {
    async function fetchUserOutLink() {
      try {
        const match = document.cookie.match(new RegExp('(^| )FastgptKey=([^;]+)'));
        const authToken = match ? match[2] : null;
        console.log('authToken:', authToken);

        const res = await fetch(`/api/histories/list?userid=${authToken}`);
        const data = await res.json();

        console.log('outlinksid:', data.data.outlinksid);
        // 拿到 outlinksid
        setFixedCustomUid(data.data.outlinksid);
      } catch (error) {
        console.error('获取用户 OutLink 失败:', error);
      } finally {
        // 不管成功或失败都要把 loadingUid 置为 false
        setLoadingUid(false);
      }
    }
    fetchUserOutLink();
  }, []);

  // 先根据 fixedCustomUid / authToken / localUId 等组合出最终的 outLinkUid
  const outLinkUid = fixedCustomUid || authToken || '';

  // 在拿到 outLinkUid 之后，再设置到全局的 outLinkAuthData
  useEffect(() => {
    setOutLinkAuthData({ shareId, outLinkUid });
    return () => {
      // 卸载时清空
      setOutLinkAuthData({});
    };
  }, [shareId, outLinkUid, setOutLinkAuthData]);

  // 也可以在这里设置 appId
  useEffect(() => {
    setAppId(props.appId);
  }, [props.appId, setAppId]);

  // 如果还在加载 outLinkUid，就先渲染一个 loading
  if (loadingUid) {
    return (
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        w="100vw"
        h="100vh"
        bg="#1e40af" // 蓝色背景
      >
        {/* Spinner 自带动画效果，可以根据需要调整大小和颜色 */}
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="white" size="xl" />
        <Text mt={4} fontSize="lg" color="white">
          Loading...
        </Text>
      </Flex>
    );
  }

  // outLinkUid 拿到后，再去渲染 ChatContextProvider
  const chatHistoryProviderParams = {
    shareId,
    outLinkUid
  };

  const chatRecordProviderParams = {
    appId: props.appId,
    shareId,
    outLinkUid,
    chatId,
    type: GetChatTypeEnum.outLink
  };
  // useMount(() => {
  //   if (!appId) {
  //     toast({
  //       status: 'warning',
  //       title: t('chat:invalid_share_url')
  //     });
  //   }
  // });

  return source === ChatSourceEnum.share ? (
    <ChatContextProvider params={chatHistoryProviderParams}>
      <ChatItemContextProvider
        showRouteToAppDetail={false}
        showRouteToDatasetDetail={false}
        isShowReadRawSource={props.showRawSource}
        isResponseDetail={props.responseDetail}
        isShowFullText={props.showFullText}
        showNodeStatus={props.showNodeStatus}
      >
        <ChatRecordContextProvider params={chatRecordProviderParams}>
          <OutLink {...props} />
        </ChatRecordContextProvider>
      </ChatItemContextProvider>
    </ChatContextProvider>
  ) : (
    <NextHead title={props.appName} desc={props.appIntro} icon={props.appAvatar} />
  );
};

export default React.memo(Render);

export async function getServerSideProps(context: any) {
  const shareId = context?.query?.shareId || '';
  const authToken = context?.query?.authToken || '';
  const customUid = context?.query?.customUid || '';

  const app = await (async () => {
    try {
      return MongoOutLink.findOne(
        {
          shareId
        },
        'appId showRawSource showNodeStatus responseDetail'
      )
        .populate<{ associatedApp: AppSchema }>('associatedApp', 'name avatar intro')
        .lean();
    } catch (error) {
      addLog.error('getServerSideProps', error);
      return undefined;
    }
  })();

  return {
    props: {
      appId: app?.appId ? String(app?.appId) : '',
      appName: app?.associatedApp?.name ?? 'AI',
      appAvatar: app?.associatedApp?.avatar ?? '',
      appIntro: app?.associatedApp?.intro ?? 'AI',
      showRawSource: app?.showRawSource ?? false,
      responseDetail: app?.responseDetail ?? false,
      showFullText: app?.showFullText ?? false,
      showNodeStatus: app?.showNodeStatus ?? false,
      shareId: shareId ?? '',
      authToken: authToken ?? '',
      customUid,
      ...(await serviceSideProps(context, ['file', 'app', 'chat', 'workflow']))
    }
  };
}
