import { useSystemStore } from '@/web/common/system/useSystemStore';
import { Box, Flex, Spinner, Textarea } from '@chakra-ui/react';
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { type ChatBoxInputFormType, type ChatBoxInputType, type SendPromptFnType } from '../type';
import { textareaMinH } from '../constants';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { ChatBoxContext } from '../Provider';
import dynamic from 'next/dynamic';
import { useContextSelector } from 'use-context-selector';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { documentFileType } from '@fastgpt/global/common/file/constants';
import FilePreview from '../../components/FilePreview';
import { useFileUpload } from '../hooks/useFileUpload';
import ComplianceTip from '@/components/common/ComplianceTip/index';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { Select } from '@chakra-ui/react';
import { MessageProvider, useMessageContext } from '@/context/MessageContext';
import VoiceInput, { type VoiceInputComponentRef } from './VoiceInput';
const InputGuideBox = dynamic(() => import('./InputGuideBox'));

const fileTypeFilter = (file: File) => {
  return (
    file.type.includes('image') ||
    documentFileType.split(',').some((type) => file.name.endsWith(type.trim()))
  );
};

const ChatInput = ({
  onSendMessage,
  onStop,
  TextareaDom,
  resetInputVal,
  chatForm
}: {
  onSendMessage: SendPromptFnType;
  onStop: () => void;
  TextareaDom: React.MutableRefObject<HTMLTextAreaElement | null>;
  resetInputVal: (val: ChatBoxInputType) => void;
  chatForm: UseFormReturn<ChatBoxInputFormType>;
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isPc } = useSystem();
  const VoiceInputRef = useRef<VoiceInputComponentRef>(null);

  const { setValue, watch, control } = chatForm;
  const inputValue = watch('input');

  const outLinkAuthData = useContextSelector(ChatBoxContext, (v) => v.outLinkAuthData);
  const appId = useContextSelector(ChatBoxContext, (v) => v.appId);
  const chatId = useContextSelector(ChatBoxContext, (v) => v.chatId);
  const isChatting = useContextSelector(ChatBoxContext, (v) => v.isChatting);
  const whisperConfig = useContextSelector(ChatBoxContext, (v) => v.whisperConfig);
  const chatInputGuide = useContextSelector(ChatBoxContext, (v) => v.chatInputGuide);
  const fileSelectConfig = useContextSelector(ChatBoxContext, (v) => v.fileSelectConfig);

  const fileCtrl = useFieldArray({
    control,
    name: 'files'
  });
  const {
    File,
    onOpenSelectFile,
    fileList,
    onSelectFile,
    uploadFiles,
    selectFileIcon,
    selectFileLabel,
    showSelectFile,
    showSelectImg,
    removeFiles,
    replaceFiles,
    hasFileUploading
  } = useFileUpload({
    fileSelectConfig,
    fileCtrl,
    outLinkAuthData,
    appId,
    chatId
  });
  const havInput = !!inputValue || fileList.length > 0;
  const canSendMessage = havInput && !hasFileUploading;
  // 深度思考 背景是否显示
  const [isActive, setIsActive] = useState(true);
  const [repository, setRepository] = useState([
    {
      _id: 'No_Knowledge',
      name: '知识库0'
    }
  ]);

  const mockKnowledgeBase = [
    { id: 'kb_1', name: '知识库1' },
    { id: 'kb_2', name: '知识库2' },
    { id: 'kb_3', name: '知识库3' }
  ];
  const { message, setMessage } = useMessageContext();

  const [selectedValue, setSelectedValue] = useState('No_Knowledge');
  console.log(88888, selectedValue);

  // const [customVar1, setCustomVar1] = useState(1);
  useEffect(() => {
    async function fetchgetUser() {
      try {
        const match = document.cookie.match(new RegExp('(^| )FastgptKey=([^;]+)'));
        const authToken = match ? match[2] : null;
        console.log('authToken:', authToken);
        console.log('username:12', authToken);

        const res = await fetch(`/api/user/getuser?username=${authToken}`);
        const data = await res.json();

        console.log('username:11', data.data._id);

        const res1 = await fetch(`/api/team/getteam?userId=` + data.data._id);
        const data1 = await res1.json();
        console.log('data1', data1.data.teamId);

        const res2 = await fetch(`/api/getdatasets/getdatasets?teamId=` + data1.data.teamId);
        const data2 = await res2.json();
        console.log('data2', data2.data);

        setRepository(data2.data);
      } catch (error) {
        console.error('获取用户 OutLink 失败:', error);
      } finally {
        // 不管成功或失败都要把 loadingUid 置为 false
        //  setLoadingUid(false);
      }
    }

    fetchgetUser();
  }, []);
  const [customVar1, setCustomVar1] = useState(1);
  // 处理点击事件，切换值
  const handleToggleVariable = () => {
    setCustomVar1((prev) => (prev === 1 ? 2 : 1));
  };
  // 初始值为0 ，默认非深度思考
  const [flag, setFlag] = useState(0);
  useEffect(() => {
    send(); // flag 变化后自动触发
  }, [flag, selectedValue]);

  const send = () => {
    setMessage({
      deep: flag,
      selectedValue
    });
  };

  // Upload files
  useRequest2(uploadFiles, {
    manual: false,
    errorToast: t('common:upload_file_error'),
    refreshDeps: [fileList, outLinkAuthData, chatId]
  });

  /* on send */
  const handleSend = useCallback(
    async (val?: string) => {
      if (!canSendMessage) return;
      const textareaValue = val || TextareaDom.current?.value || '';

      onSendMessage({
        text: textareaValue.trim(),
        files: fileList
      });
      replaceFiles([]);
    },
    [TextareaDom, canSendMessage, fileList, onSendMessage, replaceFiles]
  );

  const RenderTextarea = useMemo(
    () => (
      <Flex alignItems={'flex-end'} mt={fileList.length > 0 ? 1 : 0} pl={[2, 4]}>
        <Flex
          direction={'column'}
          gap={0}
          width={'100%'}
          alignItems={'left'}
          justifyContent={'left'}
        >
          {/* input area */}
          <Textarea
            ref={TextareaDom}
            py={0}
            pl={2}
            pr={['30px', '48px']}
            border={'none'}
            _focusVisible={{
              border: 'none'
            }}
            placeholder={
              isPc ? t('common:core.chat.Type a message') : t('chat:input_placeholder_phone')
            }
            resize={'none'}
            rows={1}
            height={'22px'}
            lineHeight={'22px'}
            maxHeight={'50vh'}
            maxLength={-1}
            overflowY={'auto'}
            whiteSpace={'pre-wrap'}
            wordBreak={'break-all'}
            boxShadow={'none !important'}
            color={'myGray.900'}
            fontSize={['md', 'sm']}
            value={inputValue}
            onChange={(e) => {
              const textarea = e.target;
              textarea.style.height = textareaMinH;
              textarea.style.height = `${textarea.scrollHeight}px`;
              setValue('input', textarea.value);
            }}
            onKeyDown={(e) => {
              // enter send.(pc or iframe && enter and unPress shift)
              const isEnter = e.keyCode === 13;
              if (isEnter && TextareaDom.current && (e.ctrlKey || e.altKey)) {
                // Add a new line
                const index = TextareaDom.current.selectionStart;
                const val = TextareaDom.current.value;
                TextareaDom.current.value = `${val.slice(0, index)}\n${val.slice(index)}`;
                TextareaDom.current.selectionStart = index + 1;
                TextareaDom.current.selectionEnd = index + 1;

                TextareaDom.current.style.height = textareaMinH;
                TextareaDom.current.style.height = `${TextareaDom.current.scrollHeight}px`;

                return;
              }

              // 全选内容
              // @ts-ignore
              e.key === 'a' && e.ctrlKey && e.target?.select();

              if ((isPc || window !== parent) && e.keyCode === 13 && !e.shiftKey) {
                handleSend();
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              const clipboardData = e.clipboardData;
              if (clipboardData && (showSelectFile || showSelectImg)) {
                const items = clipboardData.items;
                const files = Array.from(items)
                  .map((item) => (item.kind === 'file' ? item.getAsFile() : undefined))
                  .filter((file) => {
                    return file && fileTypeFilter(file);
                  }) as File[];
                onSelectFile({ files });

                if (files.length > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
            }}
          />

          <Flex
            direction={'row'}
            gap={2}
            width={'100%'}
            alignItems={'center'}
            justifyContent={'left'}
            mt="20px"
          >
            {/* file selector */}
            {(showSelectFile || showSelectImg) && (
              <Flex
                h={'25px'}
                alignItems={'center'}
                justifyContent={'center'}
                cursor={'pointer'}
                transform={'translateY(1px)'}
                onClick={() => {
                  onOpenSelectFile();
                }}
              >
                <MyTooltip label={selectFileLabel}>
                  <MyIcon
                    transform="translateY(-2.5px)"
                    name={'common/add3'}
                    w={'13px'}
                    p={'8px'}
                    border="1px solid #E9E9E9"
                    borderRadius={'50%'}
                    color={'#B3B3B3'}
                  />
                </MyTooltip>
                <File onSelect={(files) => onSelectFile({ files })} />
              </Flex>
            )}

            <Flex gap="8px">
              {' '}
              {/* 添加间隔，避免元素紧贴 */}
              {/* 深度思考按钮 - 保持原有功能，样式与Select统一 */}
              <MyTooltip label="深度思考">
                <Flex
                  p="4px"
                  h="35px"
                  w="90px" // 宽度与Select一致
                  fontSize="12px"
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  borderRadius="10px" // 圆角与Select一致
                  border={`1px solid ${isActive ? '#E9E9E9' : '#DAEEFF'}`}
                  bg={isActive ? '#fff' : '#DAEEFF'}
                  color={isActive ? '#5E5E5E' : '#0285FF'}
                  onClick={() => {
                    setIsActive(!isActive);
                    handleToggleVariable();
                    setFlag(flag == 0 ? 1 : 0);
                  }}
                  _hover={{
                    bg: 'rgba(0, 0, 0, 0.04)' // 悬停效果增强一致性
                  }}
                >
                  <MyIcon
                    name="common/deep"
                    w="18px"
                    mr="3px"
                    color={isActive ? '#5E5E5E' : '#0285FF'}
                  />
                  <span>深度思考</span>
                </Flex>
              </MyTooltip>
              {/* 知识库Select - 移除默认阴影，样式与按钮统一 */}
              <MyTooltip label="知识库">
                <Select
                  placeholder="请选择知识库"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="12px" // 调整为更小的尺寸（原16px）
                      height="12px"
                      fill="none"
                    >
                      <path
                        stroke="#ccc"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 10l5 5 5-5" // 微调路径使小尺寸下更协调
                      />
                    </svg>
                  }
                  // defaultValue={repository[0].name}
                  w="130px"
                  h="35px"
                  style={{ textAlign: 'center' }}
                  fontSize="12px"
                  borderRadius="10px" // 显式设置圆角
                  border="1px solid #E9E9E9"
                  transform="translateY(0.5px)"
                  sx={{
                    boxShadow: 'none !important', // 强制移除阴影
                    _focus: {
                      borderColor: '#E9E9E9', // 聚焦时保持边框颜色一致
                      boxShadow: 'none'
                    }
                  }}
                  _hover={{
                    bg: 'rgba(0, 0, 0, 0.04)' // 悬停效果增强一致性
                  }}
                  onChange={(e) => {
                    if (e.target.value) {
                      // 正常值
                      setSelectedValue(e.target.value);
                    } else {
                      // 默认值
                      setSelectedValue('No_Knowledge');
                    }
                  }}
                >
                  {/* <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option> */}

                  {repository.map((item) => {
                    return (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    );
                  })}
                  {/* {mockKnowledgeBase.map((kb) => (
                    <option key={kb.id} value={kb.id}>
                      {kb.name}
                    </option>
                  ))} */}
                </Select>
              </MyTooltip>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          alignItems={'center'}
          position={'absolute'}
          right={[2, 4]}
          bottom={['10px', '12px']}
          zIndex={3}
        >
          {/* Voice input icon */}
          {whisperConfig?.open && !inputValue && (
            <MyTooltip label={t('common:core.chat.Record')}>
              <Flex
                alignItems={'center'}
                justifyContent={'center'}
                flexShrink={0}
                h={['28px', '32px']}
                w={['28px', '32px']}
                mr={2}
                borderRadius={'md'}
                cursor={'pointer'}
                _hover={{ bg: '#F5F5F8' }}
                onClick={() => {
                  VoiceInputRef.current?.onSpeak?.();
                }}
              >
                <MyIcon
                  name={'core/chat/recordFill'}
                  width={['22px', '25px']}
                  height={['22px', '25px']}
                  color={'myGray.600'}
                />
              </Flex>
            </MyTooltip>
          )}

          {/* send and stop icon */}
          <Flex
            alignItems={'center'}
            justifyContent={'center'}
            flexShrink={0}
            h={['28px', '32px']}
            w={['28px', '32px']}
            borderRadius={'50%'}
            bg={isChatting ? '' : !havInput || hasFileUploading ? '#000' : '#000'}
            cursor={havInput ? 'pointer' : 'not-allowed'}
            lineHeight={1}
            onClick={() => {
              if (isChatting) {
                return onStop();
              }
              return handleSend();
            }}
          >
            {isChatting ? (
              <MyIcon
                animation={'zoomStopIcon 0.4s infinite alternate'}
                width={['22px', '25px']}
                height={['22px', '25px']}
                cursor={'pointer'}
                name={'stop'}
                color={'gray.500'}
              />
            ) : (
              <MyTooltip label={t('common:core.chat.Send Message')}>
                <MyIcon
                  name={'core/chat/sendFill'}
                  width={['18px', '20px']}
                  height={['18px', '20px']}
                  color={'white'}
                />
              </MyTooltip>
            )}
          </Flex>
        </Flex>
      </Flex>
    ),
    [
      File,
      TextareaDom,
      fileList,
      handleSend,
      hasFileUploading,
      havInput,
      inputValue,
      isChatting,
      isPc,
      onOpenSelectFile,
      onSelectFile,
      onStop,
      selectFileIcon,
      selectFileLabel,
      setValue,
      showSelectFile,
      showSelectImg,
      t
    ]
  );

  return (
    <Box
      m={['0 auto', '20px auto']}
      w={'100%'}
      maxW={['auto', 'min(90%, 100%)']}
      px={[0, 5]}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();

        if (!(showSelectFile || showSelectImg)) return;
        const files = Array.from(e.dataTransfer.files);

        const droppedFiles = files.filter((file) => fileTypeFilter(file));
        if (droppedFiles.length > 0) {
          onSelectFile({ files: droppedFiles });
        }

        const invalidFileName = files
          .filter((file) => !fileTypeFilter(file))
          .map((file) => file.name)
          .join(', ');
        if (invalidFileName) {
          toast({
            status: 'warning',
            title: t('chat:unsupported_file_type'),
            description: invalidFileName
          });
        }
      }}
    >
      <Box
        pt={fileList.length > 0 ? '0' : ['14px', '18px']}
        pb={['14px', '18px']}
        position={'relative'}
        boxShadow={`0 0 10px rgba(0,0,0,0.2)`}
        borderRadius={['none', 'md']}
        bg={'white'}
        overflow={'display'}
        {...(isPc
          ? {
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.12)'
            }
          : {
              borderTop: '1px solid',
              borderTopColor: 'rgba(0,0,0,0.15)'
            })}
      >
        {/* Chat input guide box */}
        {chatInputGuide.open && (
          <InputGuideBox
            appId={appId}
            text={inputValue}
            onSelect={(e) => {
              setValue('input', e);
            }}
            onSend={(e) => {
              handleSend(e);
            }}
          />
        )}
        {/* file preview */}
        <Box px={[1, 3]}>
          <FilePreview fileList={fileList} removeFiles={removeFiles} />
        </Box>

        {/* voice input and loading container */}
        {!inputValue && (
          <VoiceInput
            ref={VoiceInputRef}
            onSendMessage={onSendMessage}
            resetInputVal={resetInputVal}
          />
        )}

        {RenderTextarea}
      </Box>
      <ComplianceTip type={'chat'} />
    </Box>
  );
};

export default React.memo(ChatInput);
