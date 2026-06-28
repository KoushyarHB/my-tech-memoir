export default function Home() {
  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6 sm:px-4 sm:py-8">
      <article className="prose dark:prose-invert max-w-none font-sans">
        <h1 className="text-2xl font-bold mt-7 mb-2.5 leading-tight text-gray-900 dark:text-white">
          The Complete Networking Masterclass
        </h1>

        <p className="my-3 text-base leading-relaxed">
          Welcome back to our networking masterclass. Today, we are going to synthesize everything we have uncovered about how the internet actually routes data to your devices.
        </p>

        <p className="my-3 text-base leading-relaxed">
          Let's review the core concepts using the exact breakdowns we've walked through, step by step.
        </p>

        <h2 className="text-xl font-semibold mt-6.5 mb-2 leading-snug text-gray-900 dark:text-white">
          1. The Math: Why 4 Bytes?
        </h2>

        <p className="my-3 text-base leading-relaxed">
          You nailed it on day one. Yes, an IPv4 address is exactly 4 bytes (which equals 32 bits, since 1 byte = 8 bits).
        </p>

        <p className="my-3 text-base leading-relaxed">
          Computers do not see numbers like 192 or 168. They only see binary—ones and zeros. Each of the 4 numbers in an IP address represents exactly 1 byte of binary data. Let's look at what 192.168.1.1 actually looks like to a computer router:
        </p>

        <pre className="my-3 overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 p-3.5 font-mono text-sm leading-relaxed text-gray-900 dark:text-gray-200">
{`  192   .   168   .    1    .    1      <- Human Readable
11000000.10101000.00000001.00000001     <- Computer Readable (Binary)
 \\____/    \\____/    \\____/    \\____/
 1 Byte    1 Byte    1 Byte    1 Byte   (= 4 Bytes Total)`}
        </pre>

        <p className="my-3 text-base leading-relaxed">
          Because 1 byte is made of 8 binary switches, the maximum number you can create by turning all 8 switches "on" (11111111) is 255 in regular numbers. That is why no single number in an IP address can ever be greater than 255.
        </p>

        <p className="my-3 text-base leading-relaxed">
          When Vint Cerf and the early internet engineers were writing the specifications for IPv4 in 1981, they had to balance hardware limitations and routing speed. Making the IP address exactly 32 bits meant a CPU could read and process an entire network address in a single hardware cycle.
        </p>

        <h2 className="text-xl font-semibold mt-6.5 mb-2 leading-snug text-gray-900 dark:text-white">
          2. What Things Have an IP? (And the Missing Versions)
        </h2>

        <p className="my-3 text-base leading-relaxed">
          An IP address does not just represent a server. A server is just a computer that sits in a data center waiting to answer requests. But any device that wants to talk to other devices using the Internet Protocol (IP) must have an IP address. We call these "hosts" or "endpoints."
        </p>

        <p className="my-3 text-base leading-relaxed">
          If a device connects directly to a network (via a Wi-Fi antenna or an Ethernet cable) to send or receive data over the internet, it has an IP address—including your laptop, phone, or smart lightbulbs.
        </p>

        <p className="my-3 text-base leading-relaxed">
          Does your Bluetooth headset have an IP? No, it does not. Bluetooth headsets use a completely different short-range wireless standard. They connect directly to your phone using unique hardware addresses called MAC addresses. Your phone acts as the translator to the internet.
        </p>

        <h3 className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-white">
          The Big Split (TCP vs. IP)
        </h3>

        <p className="my-3 text-base leading-relaxed">
          Originally, the protocols that handled cutting data into packets (TCP) and the protocols that handled routing those packets to an address (IP) were mashed together into one single system called TCP Version 1, 2, and 3. By 1978, the engineers realized this system was too bloated. They decided to split it into two separate layers: TCP to manage data integrity, and IP to manage addresses.
        </p>

        <h3 className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-white">
          What happened to IPv1, 2, 3, and 5?
        </h3>

        <p className="my-3 text-base leading-relaxed">
          In the late 1970s, versions 1, 2, and 3 were unstable, rough-draft experiments. They finalized the split between TCP and IP on their 4th attempt, creating IPv4. IPv5 was a real, layer-5 experimental protocol built in the 1980s for live voice and video streaming, but it was scrapped because it didn't fix the address shortage. Because the number "5" had already been used, engineers skipped 5 and named the modern 16-byte protocol IPv6.
        </p>

        <h2 className="text-xl font-semibold mt-6.5 mb-2 leading-snug text-gray-900 dark:text-white">
          3. The Binary Logic of Classes and 192
        </h2>

        <p className="my-3 text-base leading-relaxed">
          To humans, 192 feels completely random. But to a computer chip inside a router, 192 is one of the most beautiful, clean, and mathematically perfect numbers possible.
        </p>

        <ul className="my-3 pl-5 list-disc">
          <li className="mt-1 leading-relaxed">192 in binary: 11000000</li>
        </ul>

        <p className="my-3 text-base leading-relaxed">
          It is literally just the first two switches turned ON (11) and the remaining six switches turned completely OFF (000000). The engineers divided the 4.3 billion IPv4 addresses into 5 distinct buckets called Classes (A, B, C, D, and E) so routers could sort traffic instantly by reading these leading bits from left to right:
        </p>

        <ul className="my-3 pl-5 list-disc">
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Class A (Prefix 0):</strong> Range 0.0.0.0 to 127.255.255.255. Handed out to massive entities like tech giants and governments.
          </li>
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Class B (Prefix 10):</strong> Range 128.0.0.0 to 191.255.255.255. Reserved for large corporations and universities.
          </li>
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Class C (Prefix 110):</strong> Range 192.0.0.0 to 223.255.255.255. The lowest number you can create starting with 110 is 11000000 (192). This is meant for small businesses and home routers.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-6.5 mb-2 leading-snug text-gray-900 dark:text-white">
          4. The Loopback Address (127.0.0.1)
        </h2>

        <p className="my-3 text-base leading-relaxed">
          Before looking at the router itself, we must address another vital local tool. When you type 127.0.0.1 (localhost), you are using a special hard-coded Loopback Address. It is the networking equivalent of the word "me" or "myself".
        </p>

        <p className="my-3 text-base leading-relaxed">
          Your computer routes the data packets straight back into its own memory without ever letting them touch your network card, Wi-Fi antenna, or the outside network.
        </p>

        <h3 className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-white">
          Why 127.0.0.1 is a Class A Address
        </h3>

        <p className="my-3 text-base leading-relaxed">
          Giving away an entire Class A block (2^24 or 16.7 million addresses) to a device just so it can talk to itself sounds like absolute madness. A single Class C block, or even just one single IP address, would have made way more sense. It comes down to two things: lazy engineering and unlimited space in 1981.
        </p>

        <p className="my-3 text-base leading-relaxed">
          <strong className="font-semibold text-gray-900 dark:text-white">The Power-of-Two Shortcut in Hardware:</strong> In the late 1970s and early 1980s, computer chips inside routers were incredibly weak. Because routers only looked at the first byte to make fast routing decisions, dedicating the entire 127.X.X.X Class A block to loopback allowed hardware engineers to write a tiny piece of hardcoded logic on the network chip: "If the first byte is 127, instantly route it backward internally." Wasting an entire Class A block kept the hardware simple and fast.
        </p>

        <p className="my-3 text-base leading-relaxed">
          <strong className="font-semibold text-gray-900 dark:text-white">They Thought They Had Unlimited Space:</strong> When IPv4 was finalized in 1981, 4.3 billion addresses felt like an infinite ocean of numbers. The engineers honestly believed nobody would ever run out of IP addresses, so holding back one Class A block for loopback testing didn't seem like a big deal.
        </p>

        <h3 className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-white">
          Why a "Class C Private Address" Wouldn't Work
        </h3>

        <p className="my-3 text-base leading-relaxed">
          There is a hidden architectural reason why they couldn't mix the two:
        </p>

        <ul className="my-3 pl-5 list-disc">
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Private Addresses (192.168.X.X)</strong> are meant to be routed. They travel through your local airwaves, hit your router, and allow your phone to talk to your laptop or your smart TV.
          </li>
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">The Loopback Address (127.0.0.1)</strong> is strictly forbidden from ever leaving the machine it was born in. It is mathematically impossible for loopback traffic to touch a router or a Wi-Fi card.
          </li>
        </ul>

        <p className="my-3 text-base leading-relaxed">
          If they had made loopback a part of the 192.168 space, routers would get incredibly confused trying to differentiate between a packet meant for a real local device and a packet meant to stay entirely inside your own computer.
        </p>

        <blockquote className="my-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
          (Note: They learned their lesson in IPv6. The wasteful Class A loopback block was thrown away and compressed down to one single address: ::1).
        </blockquote>

        <h2 className="text-xl font-semibold mt-6.5 mb-2 leading-snug text-gray-900 dark:text-white">
          5. Clearing the Air: Public vs. Private Classes
        </h2>

        <p className="my-3 text-base leading-relaxed">
          Let's iron out this last crease, because the word "Class" is actually doing two different jobs here, which is causing the confusion.
        </p>

        <p className="my-3 text-base leading-relaxed">
          No, your router does not have a "Class C Public IP" facing the internet. But it creates a "Class C Private Network" inside your house. Here is the exact definition of Class C, and why it's split into two completely different personalities: Public and Private.
        </p>

        <h3 className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-white">
          The Strict Definition of Class C
        </h3>

        <p className="my-3 text-base leading-relaxed">
          Historically, an IP address is considered Class C if its very first byte (the first 8 bits) falls anywhere between the numbers 192 and 223. That is the entire rule. If the first number is 192 through 223, it is a Class C address.
        </p>

        <p className="my-3 text-base leading-relaxed">
          When the internet was created, the engineers took this massive block of Class C numbers and split it into two categories:
        </p>

        <ul className="my-3 pl-5 list-disc">
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Category A: Class C Public IPs (The Internet):</strong> The vast majority of the Class C range (like 192.0.0.0 all the way up to 223.255.255.255) was handed out to real companies, early ISPs, and websites out on the public internet.
          </li>
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Category B: Class C Private IPs (Your Living Room):</strong> The engineers took one tiny, specific slice out of that massive Class C mountain—specifically the block starting with 192.168.X.X—and said: "Nobody on earth is allowed to own this on the public internet. We are locking it away so routers can use it for local home networks."
          </li>
        </ul>

        <p className="my-3 text-base leading-relaxed">
          This 192.168.0.0 block leaves the remaining two octets wide open (32 - 16 = 16 bits left over), pointing to 2^16 = 65,536 endpoints, every single one of which is universally agreed upon by every router on Earth to be completely off the public internet and strictly local. Out of the box, almost every home router locks down the third number too using a Subnet Mask (255.255.255.0), meaning it only uses 192.168.1.X (8 bits, or 256 addresses) for your actual living room.
        </p>

        <h3 className="text-base font-semibold mt-4 mb-1 text-gray-900 dark:text-white">
          Why Your Router Has "Two Faces"
        </h3>

        <p className="my-3 text-base leading-relaxed">
          When you buy a router, it sits on the border. It has to have two completely different IP addresses to do its job:
        </p>

        <ol className="my-3 pl-5 list-decimal">
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Face 1: The Public Face (WAN):</strong> This face plugs into the wall to talk to the internet. Your ISP gives it a Public IP. As you saw with your own connection, your public IP was 104.28.239.219. Because 104 is less than 128, your router's public face is actually using a Class A Public address. ISPs use Class A because they need massive pools of numbers for millions of customers.
          </li>
          <li className="mt-1 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">Face 2: The Private Face (LAN):</strong> This face talks to your phone and laptop over Wi-Fi. Your router assigns itself the default local identity of 192.168.1.1. Because 192 falls into that special reserved range, your router is acting as the king of its own tiny, isolated Class C Private Network.
          </li>
        </ol>
      </article>
    </main>
  )
}
