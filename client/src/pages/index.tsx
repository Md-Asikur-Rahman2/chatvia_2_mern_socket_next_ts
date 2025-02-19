/* eslint-disable react-hooks/exhaustive-deps */
import Content from "@containers/pages/Messenger/Content";
import MenuChat from "@containers/pages/Messenger/MenuChat";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect, useState } from "react";
import cookie from "cookie";
import { NextSeo } from "next-seo";
import { useSelector } from "react-redux";
import { AppState } from "@stores";
import useSocket from "@hooks/useSocket";
import { useLazyGetMessageListByConversationIdQuery } from "@stores/services/message";
import {
  ConversationStatus,
  ConversationType,
  MessageType,
  UserType,
} from "@typing/common";
import DefaultLayout from "@containers/layouts/DefaultLayout";
import { useRouter } from "next/router";
import ContactList from "@containers/pages/Messenger/ContactList";
import useResponsive from "@hooks/useResponsive";
import Online from "@containers/pages/Messenger/Online";
import MyProfile from "@containers/pages/Messenger/MyProfile";
import PendingConversation from "@containers/pages/Messenger/PendingConversation";
import { useLazyGetConversationListByUserIdQuery } from "@stores/services/conversation";

export interface FriendInformationType extends Omit<UserType, "username"> {
  name: string;
}

export interface ArrivalMessageType
  extends Pick<MessageType, "sender" | "text" | "createdAt"> {
  conversationId: string;
  conversationStatus: ConversationStatus;
}

const Messenger = () => {
  const socket = useSocket();
  const router = useRouter();
  const user = useSelector((state: AppState) => state.auth);
  const { isDesktopLg } = useResponsive();
  const [tabActive, setTabActive] = useState<string>(router.pathname);
  const [isInitialization, setIsInitialization] = useState<boolean>(false);

  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<ConversationType | null>(null);

  const [isOpenUserDetail, setIsOpenUserDetail] = useState<boolean>(false);
  const [friendInformation, setFriendInformation] =
    useState<FriendInformationType | null>(null);

  const [arrivalMessage, setArrivalMessage] =
    useState<ArrivalMessageType | null>(null);
  const [arrivalConversation, setArrivalConversation] = useState<any>(null);

  const [getMessage] = useLazyGetMessageListByConversationIdQuery();
  const [getConversation, { isFetching: isGetConversationFetching }] =
    useLazyGetConversationListByUserIdQuery();

  useEffect(() => {
    setIsInitialization(true);
  }, []);

  useEffect(() => {
    if (user.id) {
      getConversation({
        userId: user.id,
        query: {
          status:
            tabActive === "/pending"
              ? ConversationStatus.Pending
              : ConversationStatus.Accept,
        },
      })
        .unwrap()
        .then((response) => setConversations(response));
    }
  }, [getConversation, tabActive, user.id]);

  useEffect(() => {
    const conv = conversations.find(
      (item) => item._id === currentConversation?._id
    );
    if (conv) {
      setCurrentConversation(conv);
    }
  }, [conversations]);

  useEffect(() => {
    socket.current.on("getIconChanged", (data) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          ...(data.conversationId === conv?._id && {
            emoji: data.icon,
          }),
        }))
      );
      data.conversationId === currentConversation?._id &&
        setCurrentConversation(
          (prev) => ({ ...prev, emoji: data.icon } as ConversationType)
        );
    });

    socket.current.on("getBlockedConversation", (data) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          ...(data.conversationId === conv?._id && {
            blockedByUser: data.senderId,
          }),
        }))
      );
      data.conversationId === currentConversation?._id &&
        setCurrentConversation(
          (prev) =>
            ({ ...prev, blockedByUser: data.senderId } as ConversationType)
        );
    });

    socket.current.on("getMessage", (data) => {
      setArrivalMessage({
        conversationStatus: data.conversationStatus,
        conversationId: data.conversationId,
        sender: data.senderId,
        text: data.text,
        createdAt: new Date(),
      });
    });
    socket.current.on("getConversation", (data) => {
      setArrivalConversation(data);
    });
  }, []);

  useEffect(() => {
    if (!currentConversation?._id || !user?.id) {
      return;
    }

    getMessage({ conversationId: currentConversation?._id, userId: user.id })
      .unwrap()
      .then((response) => {
        setMessages(response);
      });
  }, [currentConversation?._id, getMessage]);

  if (!socket) {
    return;
  }

  return (
    <>
      {/* <span>{t("helloWorld")}</span> */}
      {isInitialization && (
        <DefaultLayout tabActive={tabActive} setTabActive={setTabActive}>
          <NextSeo
            {...(friendInformation
              ? { title: "Chat via - " + friendInformation.name }
              : { title: "Chat via" })}
          />

          {tabActive === "/" && (
            <MenuChat
              tabActive={tabActive}
              conversations={conversations}
              setConversations={setConversations}
              arrivalMessage={arrivalMessage}
              currentConversationId={currentConversation?._id ?? ""}
              setCurrentConversation={setCurrentConversation}
              setFriendInformation={setFriendInformation}
              {...(isDesktopLg ? { width: 380 } : { flex: 1 })}
            />
          )}
          {tabActive === "/contact" && (
            <ContactList {...(isDesktopLg ? { width: 380 } : { flex: 1 })} />
          )}
          {tabActive === "/me" && (
            <MyProfile {...(isDesktopLg ? { width: 380 } : { flex: 1 })} />
          )}
          {tabActive === "/pending" && (
            <PendingConversation
              isFetching={isGetConversationFetching}
              conversations={conversations}
              setConversations={setConversations}
              arrivalConversation={arrivalConversation}
              currentConversationId={currentConversation?._id ?? ""}
              setCurrentConversation={setCurrentConversation}
              setFriendInformation={setFriendInformation}
              {...(isDesktopLg ? { width: 380 } : { flex: 1 })}
            />
          )}
          <Content
            blockedByUser={currentConversation?.blockedByUser}
            createdById={currentConversation?.createdBy}
            conversationStatus={currentConversation?.status}
            emoji={currentConversation?.emoji ?? ""}
            setConversations={setConversations}
            conversationId={currentConversation?._id ?? ""}
            setCurrentConversation={setCurrentConversation}
            arrivalMessage={arrivalMessage}
            setMessages={setMessages}
            messages={messages}
            flex={3}
            friendInformation={friendInformation}
            setIsOpenUserDetail={setIsOpenUserDetail}
            receiverId={
              currentConversation?.members.find((member) => member !== user.id) ?? ""
            }
          />
          <Online
            isOpenUserDetail={isOpenUserDetail}
            setIsOpenUserDetail={setIsOpenUserDetail}
            friendInformation={friendInformation}
            flex={1}
          />
        </DefaultLayout>
      )}
    </>
  );
};

export default Messenger;

export async function getServerSideProps(ctx) {
  const { locale, ...rest } = ctx;
  const { tokenMessage } = cookie.parse(rest.req.headers.cookie ?? "");

  if (!tokenMessage) {
    return {
      redirect: {
        destination: "/auth",
        permanent: true,
      },
    };
  }

  return {
    props: { ...(await serverSideTranslations(locale, ["common"])), locale },
  };
}
