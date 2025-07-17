import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Flex, Box } from '@chakra-ui/react';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import { useTranslation } from 'next-i18next';
import Badge from '../Badge';
import MyIcon from '@fastgpt/web/components/common/Icon';

const NavbarPhone = ({ unread }: { unread: number }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { lastChatAppId } = useChatStore();
  // 管理员登录ture：显示左侧完整导航栏
  // 非管理员登录 false：除了知识库其他的都隐藏
  const [menuControl, setMenuControl] = useState(false);
  useEffect(() => {
    // 若 Cookie 是 "FastgptKey=abc123; otherKey=xxx"，则匹配 "FastgptKey=abc123"，并捕获 "abc123"
    const match = document.cookie.match(new RegExp('(^| )is_admin=([^;]+)'));
    // const root = document.cookie.match(new RegExp('(^| )root=([^;]+)'));
    const root = localStorage.getItem('root');
    console.log('root', root);
    // match[2] 是正则中第二个捕获组 ([^;]+) 的值（即 FastgptKey 对应的值

    if ((match && match[2] && match[2] == '11') || (root && root == 'true')) {
      setMenuControl(true);
    } else {
      setMenuControl(false);
    }
  }, []);

  const navbarList = useMemo(() => {
    const fullNavbarList = [
      // {
      //   label: t('common:navbar.Chat'),
      //   icon: 'core/chat/chatLight',
      //   activeIcon: 'core/chat/chatFill',
      //   link: `/chat?appId=${lastChatAppId}`,
      //   activeLink: ['/chat'],
      //   unread: 0
      // },
      {
        label: t('common:navbar.Studio'),
        icon: 'core/app/aiLight',
        activeIcon: 'core/app/aiFill',
        link: `/app/list`,
        activeLink: ['/app/list', '/app/detail'],
        unread: 0
      },
      {
        label: t('common:navbar.Datasets'),
        icon: 'core/dataset/datasetLight',
        activeIcon: 'core/dataset/datasetFill',
        link: `/dataset/list`,
        activeLink: ['/dataset/list', '/dataset/detail'],
        unread: 0
      },
      // {
      //   label: t('common:navbar.Toolkit'),
      //   icon: 'phoneTabbar/tool',
      //   activeIcon: 'phoneTabbar/toolFill',
      //   link: `/toolkit`,
      //   activeLink: ['/toolkit'],
      //   unread: 0
      // },
      {
        label: t('common:navbar.Account'),
        icon: 'support/user/userLight',
        activeIcon: 'support/user/userFill',
        link: '/account/model',
        activeLink: [
          '/account/bill',
          '/account/info',
          '/account/team',
          '/account/usage',
          '/account/apikey',
          '/account/setting',
          '/account/inform',
          '/account/promotion',
          '/account/model'
        ],
        unread
      }
    ];
    const fullNavbarList1 = [
      {
        label: t('common:navbar.Datasets'),
        icon: 'core/dataset/datasetLight',
        activeIcon: 'core/dataset/datasetFill',
        link: `/dataset/list`,
        activeLink: ['/dataset/list', '/dataset/detail'],
        unread: 0
      }
    ];
    return menuControl ? fullNavbarList : fullNavbarList1;
  }, [t, lastChatAppId, unread, menuControl]);

  return (
    <>
      <Flex
        alignItems={'center'}
        h={'100%'}
        justifyContent={navbarList.length == 1 ? 'center' : 'space-between'}
        backgroundColor={'white'}
        position={'relative'}
        px={4}
      >
        {navbarList.map((item) => (
          <Flex
            position={'relative'}
            key={item.link}
            cursor={'pointer'}
            borderRadius={'md'}
            textAlign={'center'}
            alignItems={'center'}
            h={'100%'}
            pt={1}
            px={3}
            transform={'scale(0.9)'}
            {...(item.activeLink.includes(router.pathname)
              ? {
                  color: 'primary.600'
                }
              : {
                  color: 'myGray.500'
                })}
            onClick={() => {
              if (item.link === router.asPath) return;
              router.push(item.link);
            }}
          >
            <Badge isDot count={item.unread}>
              <MyIcon
                name={
                  (item.activeLink.includes(router.pathname) ? item.activeIcon : item.icon) as any
                }
                width={'20px'}
                height={'20px'}
              />
              <Box fontSize={'12px'}>{item.label}</Box>
            </Badge>
          </Flex>
        ))}
      </Flex>
    </>
  );
};

export default NavbarPhone;
