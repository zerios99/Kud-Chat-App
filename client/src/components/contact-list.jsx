import { useAppStore } from "@/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { HOST } from "@/utils/constansts";
import { getColor } from "@/lib/utils";

function ContactList({ contacts, isChannel = false }) {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    selectedChatType,
    setSelectedChatMessages,
  } = useAppStore();

  const handleClick = (contact) => {
    if (isChannel) setSelectedChatType("channel");
    else setSelectedChatType("contact");
    setSelectedChatData(contact);
    if (setSelectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }
  };

  return (
    <div className="mt-5">
      {contacts.map((contact) => (
        <div
          key={contact._id}
          className={`pl-10 py-2 transition-all duration-300 cursor-pointer ${
            selectedChatData && selectedChatData._id === contact._id
              ? "bg-[#8417ff] hover:bg-[#8417ff]"
              : "hover:bg-[#f1f1f111]"
          }`}
          onClick={() => handleClick(contact)}
        >
          <div className="flex gap-5 items-center justify-start text-neutral-300">
            {!isChannel && (
              <Avatar className="w-12 h-12 rounded-full overflow-hidden">
                <AvatarImage
                  src={
                    contact.image
                      ? `${HOST}/${contact.image}`
                      : contact?.profileImage
                  }
                  alt={contact.firstName}
                  className="object-cover w-full h-full bg-black rounded-full"
                />
                <AvatarFallback
                  className={`
                  ${
                    selectedChatData && selectedChatData._id === contact._id
                      ? "bg-[#ffffff22] border border-white/50"
                      : getColor(contact.color)
                  }
                  uppercase h-12 w-12 text-lg border-[1px] flex items-center justify-center rounded-full overflow-hidden`}
                >
                  {contact.firstName
                    ? contact.firstName.split("").shift()
                    : contact.email.split("").shift()}
                </AvatarFallback>
              </Avatar>
            )}
            {isChannel && (
              <div className="bg-[#ffffff22] h-10 w-10 flex items-center justify-center rounded-full">
                #
              </div>
            )}
            {isChannel ? (
              <span className="poppins-medium">{contact.name}</span>
            ) : (
              <span className="poppins-medium">
                {contact.firstName
                  ? `${contact.firstName} ${contact.lastName}`
                  : contact.email}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContactList;
